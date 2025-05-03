// 获取 DOM 元素
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const maxWidthInput = document.getElementById('maxWidth');
const compressBtn = document.getElementById('compressBtn');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const originalDimensions = document.getElementById('originalDimensions');
const compressedDimensions = document.getElementById('compressedDimensions');
const compressionRatio = document.getElementById('compressionRatio');
const downloadBtn = document.getElementById('downloadBtn');

// 存储原始图片数据
let originalFile = null;

// 更新质量显示
qualityInput.addEventListener('input', () => {
    qualityValue.textContent = `${qualityInput.value}%`;
});

// 拖放功能
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

// 点击上传
uploadBox.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// 处理上传的文件
function handleFile(file) {
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
    }

    originalFile = file;
    
    // 显示原始图片
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalSize.textContent = formatFileSize(file.size);
        
        // 获取图片尺寸
        const img = new Image();
        img.onload = () => {
            originalDimensions.textContent = `${img.width} × ${img.height}`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // 启用压缩按钮
    compressBtn.disabled = false;
}

// 压缩图片
compressBtn.addEventListener('click', () => {
    if (!originalFile) return;

    const quality = qualityInput.value / 100;
    const maxWidth = parseInt(maxWidthInput.value);

    // 创建图片对象
    const img = new Image();
    img.onload = () => {
        // 计算新的尺寸
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
        }

        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob((blob) => {
            // 显示压缩后的图片
            const compressedUrl = URL.createObjectURL(blob);
            compressedImage.src = compressedUrl;
            compressedSize.textContent = formatFileSize(blob.size);
            compressedDimensions.textContent = `${width} × ${height}`;
            
            // 计算压缩率
            const ratio = ((1 - blob.size / originalFile.size) * 100).toFixed(1);
            compressionRatio.textContent = `${ratio}%`;

            // 启用下载按钮
            downloadBtn.disabled = false;
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = compressedUrl;
                link.download = `compressed_${originalFile.name}`;
                link.click();
            };
        }, originalFile.type, quality);
    };
    img.src = URL.createObjectURL(originalFile);
});

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 