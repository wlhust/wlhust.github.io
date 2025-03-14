import asyncio
import websockets
import json
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
import gymnasium as gym
import time
from websockets.server import serve
from websockets.exceptions import ConnectionClosedOK

# 设置随机种子
torch.manual_seed(0)
np.random.seed(0)

class ActorCritic(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(ActorCritic, self).__init__()
        
        # 共享特征提取层
        self.features = nn.Sequential(
            nn.Linear(state_dim, 64),
            nn.Tanh(),
            nn.Linear(64, 32),
            nn.Tanh()
        )
        
        # Actor网络（策略网络）
        self.actor = nn.Sequential(
            nn.Linear(32, action_dim),
            nn.Softmax(dim=-1)
        )
        
        # Critic网络（价值网络）
        self.critic = nn.Linear(32, 1)
        
    def forward(self, state):
        features = self.features(state)
        action_probs = self.actor(features)
        value = self.critic(features)
        return action_probs, value
    
    def get_action(self, state):
        state = torch.FloatTensor(state).unsqueeze(0)
        action_probs, value = self.forward(state)
        action_dist = torch.distributions.Categorical(action_probs)
        action = action_dist.sample()
        log_prob = action_dist.log_prob(action)
        return action.item(), log_prob.item(), value.item()

class PPOTrainer:
    def __init__(self, state_dim, action_dim, lr=0.001):
        self.actor_critic = ActorCritic(state_dim, action_dim)
        self.optimizer = optim.Adam(self.actor_critic.parameters(), lr=lr)
        self.states = []
        self.actions = []
        self.rewards = []
        self.values = []
        self.logprobs = []
        self.dones = []
        
    def update(self, gamma=0.99, epsilon=0.2, c1=0.5):
        states = torch.FloatTensor(np.array(self.states))
        actions = torch.LongTensor(np.array(self.actions))
        rewards = torch.FloatTensor(np.array(self.rewards))
        values = torch.FloatTensor(np.array(self.values))
        logprobs = torch.FloatTensor(np.array(self.logprobs))
        
        # 计算优势函数
        advantages = rewards - values
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        # 更新策略
        action_probs, new_values = self.actor_critic(states)
        dist = torch.distributions.Categorical(action_probs)
        new_logprobs = dist.log_prob(actions)
        
        ratio = torch.exp(new_logprobs - logprobs)
        surr1 = ratio * advantages
        surr2 = torch.clamp(ratio, 1-epsilon, 1+epsilon) * advantages
        actor_loss = -torch.min(surr1, surr2).mean()
        
        # 更新价值函数
        critic_loss = F.mse_loss(new_values.squeeze(), rewards)
        
        # 总损失
        loss = actor_loss + c1 * critic_loss
        
        # 优化
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        # 清空缓冲区
        self.states.clear()
        self.actions.clear()
        self.rewards.clear()
        self.values.clear()
        self.logprobs.clear()
        self.dones.clear()
        
        return float(loss.item())

async def train_cartpole(websocket, path):
    print("New client connected")
    # 创建环境
    env = gym.make('CartPole-v1')
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n
    
    # 创建PPO训练器
    trainer = PPOTrainer(state_dim, action_dim)
    
    # 训练参数
    max_episodes = 1000
    max_steps = 500
    target_reward = 475
    update_frequency = 100
    
    episode = 0
    total_steps = 0
    episode_losses = []  # 记录每个episode的损失
    
    try:
        # 等待开始训练的信号
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get('command') == 'start':
                    break
            except json.JSONDecodeError:
                continue

        while episode < max_episodes:
            state, _ = env.reset()
            episode_reward = 0
            steps = 0
            start_time = time.time()
            episode_loss = 0
            update_count = 0
            
            while True:
                # 获取动作概率和价值估计
                state_tensor = torch.FloatTensor(state).unsqueeze(0)
                action_probs, value = trainer.actor_critic(state_tensor)
                action_dist = torch.distributions.Categorical(action_probs)
                action = action_dist.sample()
                log_prob = action_dist.log_prob(action)
                
                # 执行动作
                next_state, reward, terminated, truncated, _ = env.step(action.item())
                done = terminated or truncated
                
                # 存储经验
                trainer.states.append(state)
                trainer.actions.append(action.item())
                trainer.rewards.append(reward)
                trainer.values.append(value.item())
                trainer.logprobs.append(log_prob.item())
                trainer.dones.append(done)
                
                state = next_state
                episode_reward += reward
                steps += 1
                total_steps += 1
                
                # 计算FPS
                fps = steps / (time.time() - start_time)
                
                # 定期更新策略
                if len(trainer.states) >= update_frequency:
                    loss = trainer.update()
                    episode_loss += loss
                    update_count += 1
                    print(f"Episode {episode}, Step {steps}, Loss: {loss:.4f}")
                
                # 获取当前状态的动作概率和价值估计
                with torch.no_grad():
                    current_probs, current_value = trainer.actor_critic(torch.FloatTensor(state).unsqueeze(0))
                
                # 发送状态到前端
                state_data = {
                    'state': state.tolist(),
                    'episode': episode,
                    'reward': float(episode_reward),
                    'steps': steps,
                    'fps': fps,
                    'action_probs': current_probs.squeeze().tolist(),
                    'value_estimate': float(current_value.item()),
                    'total_loss': float(episode_loss / max(1, update_count)),
                    'training_stats': {
                        'total_episodes': episode,
                        'total_steps': total_steps,
                        'avg_reward': float(episode_reward / steps),
                        'updates_count': update_count
                    }
                }
                try:
                    await websocket.send(json.dumps(state_data))
                except (ConnectionClosedOK, websockets.exceptions.ConnectionClosed):
                    print("Client disconnected")
                    return
                
                if done or steps >= max_steps:
                    break
                
                # 控制帧率
                await asyncio.sleep(0.016)  # 约60FPS
            
            # 记录episode的平均损失
            if update_count > 0:
                episode_losses.append(episode_loss / update_count)
            
            print(f"Episode {episode}, Reward: {episode_reward:.1f}, Steps: {steps}")
            
            # 检查是否达到目标
            if episode_reward >= target_reward:
                print(f"Solved in {episode} episodes!")
                try:
                    await websocket.send(json.dumps({
                        'type': 'solved',
                        'episode': episode,
                        'total_steps': total_steps,
                        'final_reward': float(episode_reward)
                    }))
                except (ConnectionClosedOK, websockets.exceptions.ConnectionClosed):
                    print("Client disconnected")
                    return
                break
            
            episode += 1
            
    except (ConnectionClosedOK, websockets.exceptions.ConnectionClosed):
        print("Client disconnected")
    finally:
        env.close()

async def main():
    print("Starting server on ws://localhost:8765")
    async with serve(
        train_cartpole,
        "localhost",
        8765,
        ping_interval=None,
        ping_timeout=None,
        compression=None,
        max_size=2**25,  # 增加最大消息大小
        max_queue=2**10,  # 增加队列大小
        read_limit=2**16,
        write_limit=2**16,
        close_timeout=10,
    ) as server:
        await asyncio.Future()  # 运行直到被终止

if __name__ == "__main__":
    asyncio.run(main()) 