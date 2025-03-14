import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
import pygame
import gymnasium as gym
from collections import deque
import time

# 设置随机种子以确保可重复性
torch.manual_seed(0)
np.random.seed(0)

class PPOMemory:
    def __init__(self):
        self.states = []
        self.actions = []
        self.rewards = []
        self.values = []
        self.logprobs = []
        self.dones = []
        
    def clear(self):
        self.states.clear()
        self.actions.clear()
        self.rewards.clear()
        self.values.clear()
        self.logprobs.clear()
        self.dones.clear()
        
    def compute_advantages(self, gamma=0.99, gae_lambda=0.95):
        rewards = np.array(self.rewards)
        values = np.array(self.values)
        dones = np.array(self.dones)
        
        advantages = np.zeros_like(rewards)
        last_gae = 0
        
        for t in reversed(range(len(rewards))):
            if t == len(rewards) - 1:
                next_value = 0
            else:
                next_value = values[t + 1]
                
            delta = rewards[t] + gamma * next_value * (1 - dones[t]) - values[t]
            advantages[t] = last_gae = delta + gamma * gae_lambda * (1 - dones[t]) * last_gae
            
        returns = advantages + values
        return torch.FloatTensor(advantages), torch.FloatTensor(returns)

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
    def __init__(self, state_dim, action_dim, lr=0.001, gamma=0.99, gae_lambda=0.95,
                 clip_epsilon=0.2, epochs=10, batch_size=32):
        self.actor_critic = ActorCritic(state_dim, action_dim)
        self.optimizer = optim.Adam(self.actor_critic.parameters(), lr=lr)
        self.memory = PPOMemory()
        
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.epochs = epochs
        self.batch_size = batch_size
        
    def update(self):
        advantages, returns = self.memory.compute_advantages(self.gamma, self.gae_lambda)
        
        states = torch.FloatTensor(np.array(self.memory.states))
        actions = torch.LongTensor(np.array(self.memory.actions))
        old_logprobs = torch.FloatTensor(np.array(self.memory.logprobs))
        
        # 归一化优势函数
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        for _ in range(self.epochs):
            # 生成随机批次
            indices = np.random.permutation(len(states))
            for start_idx in range(0, len(states), self.batch_size):
                end_idx = start_idx + self.batch_size
                batch_indices = indices[start_idx:end_idx]
                
                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_advantages = advantages[batch_indices]
                batch_returns = returns[batch_indices]
                batch_old_logprobs = old_logprobs[batch_indices]
                
                # 计算当前策略的动作概率和状态值
                action_probs, values = self.actor_critic(batch_states)
                dist = torch.distributions.Categorical(action_probs)
                curr_logprobs = dist.log_prob(batch_actions)
                
                # 计算策略比率
                ratios = torch.exp(curr_logprobs - batch_old_logprobs)
                
                # 计算PPO目标函数
                surr1 = ratios * batch_advantages
                surr2 = torch.clamp(ratios, 1-self.clip_epsilon, 1+self.clip_epsilon) * batch_advantages
                actor_loss = -torch.min(surr1, surr2).mean()
                
                # 计算价值损失
                critic_loss = F.mse_loss(values.squeeze(), batch_returns)
                
                # 总损失
                loss = actor_loss + 0.5 * critic_loss
                
                # 优化
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
        
        self.memory.clear()

class CartPoleVisualizer:
    def __init__(self, width=800, height=400):
        pygame.init()
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption('CartPole PPO Training')
        
        # 可视化参数
        self.scale = 100  # 像素/米
        self.cart_width = 50
        self.cart_height = 30
        self.pole_width = 10
        self.wheel_radius = 5
        
        # 统计信息
        self.episode_rewards = deque(maxlen=100)
        self.max_reward = 0
        self.font = pygame.font.Font(None, 36)
        
    def render(self, state, episode, total_reward, fps):
        self.screen.fill((240, 240, 240))  # 浅灰色背景
        
        # 绘制地面
        pygame.draw.line(self.screen, (100, 100, 100),
                        (0, self.height//2 + 50),
                        (self.width, self.height//2 + 50), 2)
        
        # 获取状态信息
        x, _, theta, _ = state
        
        # 转换坐标（将原点移到画布中心）
        cart_x = self.width//2 + x * self.scale
        cart_y = self.height//2
        
        # 绘制小车
        pygame.draw.rect(self.screen, (52, 152, 219),  # 蓝色
                        (cart_x - self.cart_width//2,
                         cart_y - self.cart_height//2,
                         self.cart_width,
                         self.cart_height))
        
        # 绘制车轮
        pygame.draw.circle(self.screen, (44, 62, 80),  # 深蓝色
                          (int(cart_x - self.cart_width//4),
                           int(cart_y + self.cart_height//2)),
                          self.wheel_radius)
        pygame.draw.circle(self.screen, (44, 62, 80),
                          (int(cart_x + self.cart_width//4),
                           int(cart_y + self.cart_height//2)),
                          self.wheel_radius)
        
        # 绘制杆子
        pole_length = 100
        pole_end_x = cart_x + np.sin(theta) * pole_length
        pole_end_y = cart_y - np.cos(theta) * pole_length
        pygame.draw.line(self.screen, (231, 76, 60),  # 红色
                        (cart_x, cart_y),
                        (pole_end_x, pole_end_y),
                        self.pole_width)
        
        # 显示统计信息
        self.episode_rewards.append(total_reward)
        avg_reward = np.mean(self.episode_rewards) if self.episode_rewards else 0
        self.max_reward = max(self.max_reward, total_reward)
        
        texts = [
            f"Episode: {episode}",
            f"Current Reward: {total_reward:.1f}",
            f"Average Reward: {avg_reward:.1f}",
            f"Max Reward: {self.max_reward:.1f}",
            f"FPS: {fps:.1f}"
        ]
        
        for i, text in enumerate(texts):
            surface = self.font.render(text, True, (0, 0, 0))
            self.screen.blit(surface, (10, 10 + i * 30))
        
        pygame.display.flip()
        
    def close(self):
        pygame.quit()

def main():
    # 创建环境
    env = gym.make('CartPole-v1')
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n
    
    # 创建PPO训练器
    trainer = PPOTrainer(state_dim, action_dim)
    
    # 创建可视化器
    visualizer = CartPoleVisualizer()
    
    # 训练参数
    max_episodes = 1000
    max_steps = 500
    target_reward = 475
    update_frequency = 2000  # 每收集多少步数据更新一次策略
    
    # 训练循环
    episode = 0
    total_steps = 0
    running = True
    
    try:
        while running and episode < max_episodes:
            state, _ = env.reset()
            episode_reward = 0
            steps = 0
            start_time = time.time()
            
            while True:
                # 处理Pygame事件
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        running = False
                        break
                    elif event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_ESCAPE:
                            running = False
                            break
                
                if not running:
                    break
                
                # 选择动作
                action, log_prob, value = trainer.actor_critic.get_action(state)
                
                # 执行动作
                next_state, reward, terminated, truncated, _ = env.step(action)
                done = terminated or truncated
                
                # 存储经验
                trainer.memory.states.append(state)
                trainer.memory.actions.append(action)
                trainer.memory.rewards.append(reward)
                trainer.memory.values.append(value)
                trainer.memory.logprobs.append(log_prob)
                trainer.memory.dones.append(done)
                
                state = next_state
                episode_reward += reward
                steps += 1
                total_steps += 1
                
                # 计算FPS
                fps = steps / (time.time() - start_time)
                
                # 可视化
                visualizer.render(state, episode, episode_reward, fps)
                
                if done or steps >= max_steps:
                    break
                
                # 定期更新策略
                if total_steps % update_frequency == 0:
                    trainer.update()
            
            # 每个回合结束后更新策略
            if len(trainer.memory.states) >= trainer.batch_size:
                trainer.update()
            
            print(f"Episode {episode}, Reward: {episode_reward:.1f}, Steps: {steps}")
            
            # 检查是否达到目标
            if episode_reward >= target_reward:
                print(f"Solved in {episode} episodes!")
                break
            
            episode += 1
    
    finally:
        env.close()
        visualizer.close()

if __name__ == "__main__":
    main() 