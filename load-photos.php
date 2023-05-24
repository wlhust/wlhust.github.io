<?php
$folder = 'pipi'; // 指定要读取的文件夹名称
$photos = [];

// 遍历文件夹中的所有文件
$dir = new DirectoryIterator($folder);
foreach ($dir as $fileinfo) {
    if (!$fileinfo->isDot() && $fileinfo->isFile()) {
        $photos[] = $folder . '/' . $fileinfo->getFilename();
    }
}

// 将照片数据作为JSON返回
header('Content-Type: application/json');
echo json_encode($photos);
?>
