// 批量压缩模式相关功能
document.addEventListener('DOMContentLoaded', function() {
    const batchModeBtn = document.getElementById('batchModeBtn');
    const singleModeBtn = document.getElementById('singleModeBtn');
    const batchMode = document.getElementById('batchMode');
    const singleMode = document.getElementById('singleMode');
    const batchFileInput = document.getElementById('batchFileInput');
    const fileList = document.getElementById('fileList');
    const batchCompressBtn = document.getElementById('batchCompressBtn');
    const batchDownloadBtn = document.getElementById('batchDownloadBtn');
    const batchDownloadAllBtn = document.getElementById('batchDownloadAllBtn');
    const batchQuality = document.getElementById('batchQuality');
    const batchQualityValue = document.getElementById('batchQualityValue');
    const batchMaxWidth = document.getElementById('batchMaxWidth');

    // 添加清空列表按钮
    const clearListBtn = document.createElement('button');
    clearListBtn.className = 'clear-list-btn';
    clearListBtn.textContent = '清空列表';
    fileList.parentNode.insertBefore(clearListBtn, fileList);

    // 清空列表功能
    clearListBtn.addEventListener('click', () => {
        if (uploadedFiles.length === 0) {
            alert('列表已经是空的');
            return;
        }
        
        if (confirm('确定要清空所有图片吗？')) {
            // 释放所有图片的URL对象
            uploadedFiles.forEach(file => {
                if (file.thumbnailUrl) {
                    URL.revokeObjectURL(file.thumbnailUrl);
                }
            });
            
            uploadedFiles = [];
            compressedFiles = [];
            updateFileList();
            clearPreview();
            
            // 清空压缩结果
            const resultContainer = document.querySelector('.compression-results');
            if (resultContainer) {
                resultContainer.remove();
            }
        }
    });

    let uploadedFiles = [];
    let compressedFiles = [];
    let currentPreviewIndex = 0;

    // 模式切换
    batchModeBtn.addEventListener('click', () => {
        batchModeBtn.classList.add('active');
        singleModeBtn.classList.remove('active');
        batchMode.style.display = 'block';
        singleMode.style.display = 'none';
    });

    singleModeBtn.addEventListener('click', () => {
        singleModeBtn.classList.add('active');
        batchModeBtn.classList.remove('active');
        singleMode.style.display = 'block';
        batchMode.style.display = 'none';
    });

    // 质量滑块显示
    batchQuality.addEventListener('input', () => {
        batchQualityValue.textContent = batchQuality.value + '%';
    });

    // 文件上传处理
    batchFileInput.addEventListener('change', handleFileSelect);
    
    // 点击上传区域触发文件选择
    const batchUploadBox = document.getElementById('batchUploadBox');
    batchUploadBox.addEventListener('click', () => {
        batchFileInput.click();
    });

    batchUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        batchUploadBox.classList.add('dragover');
    });

    batchUploadBox.addEventListener('dragleave', () => {
        batchUploadBox.classList.remove('dragover');
    });

    batchUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        batchUploadBox.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type === 'image/jpeg' || file.type === 'image/png'
        );
        handleFiles(files);
    });

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        handleFiles(files);
        // 清空input的value，这样相同文件可以重复选择
        e.target.value = '';
    }

    function handleFiles(files) {
        // 过滤出图片文件
        const imageFiles = files.filter(file => 
            file.type === 'image/jpeg' || file.type === 'image/png'
        );
        
        if (imageFiles.length === 0) {
            alert('请选择JPG或PNG格式的图片');
            return;
        }

        uploadedFiles = [...uploadedFiles, ...imageFiles];
        updateFileList();
        if (uploadedFiles.length > 0) {
            previewImage(0);
        }
    }

    function updateFileList() {
        fileList.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // 创建缩略图URL
            const thumbnailUrl = URL.createObjectURL(file);
            
            fileItem.innerHTML = `
                <div class="file-preview">
                    <img src="${thumbnailUrl}" alt="${file.name}" class="file-thumbnail">
                    <div class="file-info">
                        <span class="file-name" title="${file.name}">${file.name}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                    </div>
                </div>
                <button class="remove-file" data-index="${index}">×</button>
            `;
            fileList.appendChild(fileItem);
        });

        // 添加删除文件事件监听
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                // 释放URL对象
                URL.revokeObjectURL(uploadedFiles[index].thumbnailUrl);
                uploadedFiles.splice(index, 1);
                updateFileList();
            });
        });
    }

    function previewImage(index) {
        if (index < 0 || index >= uploadedFiles.length) return;
        
        currentPreviewIndex = index;
        const file = uploadedFiles[index];
        
        // 显示原始图片
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('batchOriginalImage');
            img.src = e.target.result;
            img.onload = () => {
                document.getElementById('batchOriginalDimensions').textContent = 
                    `${img.naturalWidth} × ${img.naturalHeight}`;
            };
            document.getElementById('batchOriginalSize').textContent = formatFileSize(file.size);
        };
        reader.readAsDataURL(file);
    }

    function clearPreview() {
        // 清空压缩结果容器
        const resultContainer = document.querySelector('.compression-results');
        if (resultContainer) {
            resultContainer.remove();
        }
    }

    // 压缩处理
    batchCompressBtn.addEventListener('click', async () => {
        if (uploadedFiles.length === 0) {
            alert('请先上传图片');
            return;
        }

        const quality = parseInt(batchQuality.value) / 100;
        const maxWidth = parseInt(batchMaxWidth.value);
        compressedFiles = [];

        // 禁用压缩按钮，显示进度
        batchCompressBtn.disabled = true;
        batchCompressBtn.textContent = '压缩中...';
        batchDownloadAllBtn.disabled = true;  // 确保下载全部按钮初始状态为禁用

        try {
            // 创建进度显示元素
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">0/${uploadedFiles.length}</div>
            `;
            batchCompressBtn.parentNode.insertBefore(progressContainer, batchCompressBtn.nextSibling);

            // 创建压缩结果容器
            const resultContainer = document.createElement('div');
            resultContainer.className = 'compression-results';
            batchCompressBtn.parentNode.insertBefore(resultContainer, progressContainer.nextSibling);

            // 批量压缩处理
            for (let i = 0; i < uploadedFiles.length; i++) {
                const compressedFile = await compressImage(uploadedFiles[i], quality, maxWidth);
                compressedFiles.push(compressedFile);

                // 更新进度
                const progressFill = progressContainer.querySelector('.progress-fill');
                const progressText = progressContainer.querySelector('.progress-text');
                const progress = ((i + 1) / uploadedFiles.length) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${i + 1}/${uploadedFiles.length}`;

                // 创建压缩结果项
                const resultItem = document.createElement('div');
                resultItem.className = 'compression-result-item';
                const originalSize = uploadedFiles[i].size;
                const compressedSize = compressedFile.size;
                const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
                
                resultItem.innerHTML = `
                    <div class="result-preview">
                        <div class="original-image">
                            <img src="${URL.createObjectURL(uploadedFiles[i])}" alt="原图">
                            <div class="image-info">
                                <p>原始大小：${formatFileSize(originalSize)}</p>
                            </div>
                        </div>
                        <div class="compressed-image">
                            <img src="${URL.createObjectURL(compressedFile)}" alt="压缩后">
                            <div class="image-info">
                                <p>压缩后：${formatFileSize(compressedSize)}</p>
                                <p>压缩率：${ratio}%</p>
                            </div>
                        </div>
                    </div>
                    <button class="download-btn" data-index="${i}">下载压缩图片</button>
                `;
                resultContainer.appendChild(resultItem);
            }

            // 压缩完成后恢复按钮状态
            batchCompressBtn.textContent = '开始压缩';
            batchCompressBtn.disabled = false;
            batchDownloadAllBtn.disabled = false;  // 启用下载全部按钮

            // 移除进度条
            progressContainer.remove();

            // 添加下载按钮事件监听
            document.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    downloadFile(compressedFiles[index]);
                });
            });

            // 显示完成消息
            alert(`压缩完成！共处理 ${uploadedFiles.length} 张图片`);
        } catch (error) {
            console.error('压缩过程中出错:', error);
            alert('压缩过程中出现错误，请重试');
            batchCompressBtn.textContent = '开始压缩';
            batchCompressBtn.disabled = false;
            batchDownloadAllBtn.disabled = true;  // 发生错误时禁用下载全部按钮
        }
    });

    async function compressImage(file, quality, maxWidth) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // 计算新的尺寸
                    if (width > maxWidth) {
                        height = (maxWidth * height) / width;
                        width = maxWidth;
                    }

                    // 如果图片尺寸太大，进一步缩小
                    const maxDimension = 1920; // 最大尺寸限制
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = (maxDimension * height) / width;
                            width = maxDimension;
                        } else {
                            width = (maxDimension * width) / height;
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    // 使用更好的图像平滑算法
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // 绘制图片
                    ctx.drawImage(img, 0, 0, width, height);

                    // 根据图片类型和大小动态调整压缩质量
                    let finalQuality = quality;
                    const fileSize = file.size;
                    
                    // 如果原图大于2MB，使用更激进的压缩
                    if (fileSize > 2 * 1024 * 1024) {
                        finalQuality = Math.min(quality, 0.7);
                    }
                    // 如果原图大于1MB，适当增加压缩
                    else if (fileSize > 1024 * 1024) {
                        finalQuality = Math.min(quality, 0.8);
                    }

                    // 对于PNG图片，使用更低的压缩质量
                    if (file.type === 'image/png') {
                        finalQuality = Math.min(quality, 0.9);
                    }

                    canvas.toBlob((blob) => {
                        // 如果压缩后比原图大，直接用原图
                        if (blob.size >= file.size) {
                            resolve(file);
                        } else {
                            resolve(new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            }));
                        }
                    }, file.type, finalQuality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 下载功能
    batchDownloadBtn.addEventListener('click', () => {
        if (compressedFiles.length === 0) return;
        downloadFile(compressedFiles[currentPreviewIndex]);
    });

    // 下载全部图片
    batchDownloadAllBtn.addEventListener('click', async () => {
        if (compressedFiles.length === 0) return;
        
        try {
            batchDownloadAllBtn.disabled = true;  // 下载时禁用按钮
            batchDownloadAllBtn.textContent = '下载中...';

            // 请求用户选择保存目录
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'downloads'
            });

            // 依次保存所有压缩后的图片
            for (let i = 0; i < compressedFiles.length; i++) {
                const file = compressedFiles[i];
                // 在文件名前添加"压缩"两个字
                const compressedFileName = '压缩_' + file.name;
                const fileHandle = await dirHandle.getFileHandle(compressedFileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(file);
                await writable.close();
            }
            
            batchDownloadAllBtn.textContent = '下载全部图片';
            batchDownloadAllBtn.disabled = false;  // 下载完成后启用按钮
            alert(`所有图片已保存到选择的文件夹！`);
        } catch (error) {
            console.error('保存过程中出错:', error);
            if (error.name === 'AbortError') {
                alert('已取消保存');
            } else {
                alert('保存过程中出现错误，请重试');
            }
            batchDownloadAllBtn.textContent = '下载全部图片';
            batchDownloadAllBtn.disabled = false;
        }
    });

    function downloadFile(file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        // 在文件名前添加"压缩"两个字
        a.download = '压缩_' + file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 