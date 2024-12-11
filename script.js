document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const downloadBtn = document.getElementById('downloadBtn');
    const controls = document.querySelector('.compression-controls');
    const previewContainer = document.querySelector('.preview-container');

    let originalFile = null;
    let compressedFile = null;

    // 设置默认压缩质量为60%
    qualitySlider.value = 60;
    qualityValue.textContent = '60%';

    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => fileInput.click());

    // 处理文件拖放
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    // 处理文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    // 处理压缩质量变化
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        if (originalFile) compressImage(originalFile);
    });

    // 处理文件
    async function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }

        originalFile = file;
        controls.style.display = 'block';
        previewContainer.style.display = 'grid';
        downloadBtn.style.display = 'block';

        // 显示原始图片
        originalPreview.src = URL.createObjectURL(file);
        originalSize.textContent = formatFileSize(file.size);

        // 压缩图片
        await compressImage(file);
    }

    // 压缩图片
    async function compressImage(file) {
        // 根据原始文件大小动态设置压缩参数
        const options = {
            // 如果原始图片小于1MB，则将目标大小设置得更小
            maxSizeMB: file.size / (1024 * 1024) > 1 ? 1 : 0.5,
            // 根据质量滑块的值设置压缩质量
            quality: qualitySlider.value / 100,
            // 限制最大尺寸，避免过大的图片
            maxWidthOrHeight: 2048,
            // 使用webworker避免阻塞主线程
            useWebWorker: true,
            // 保持EXIF数据
            preserveExif: false,
            // 根据文件类型选择合适的压缩方式
            fileType: file.type,
        };

        try {
            // 如果原始文件已经很小，就不进行压缩
            if (file.size < 50 * 1024) { // 小于50KB
                alert('文件已经很小，无需压缩！');
                compressedFile = file;
                compressedPreview.src = URL.createObjectURL(file);
                compressedSize.textContent = formatFileSize(file.size);
                return;
            }

            compressedFile = await imageCompression(file, options);
            
            // 如果压缩后反而变大，则使用原始文件
            if (compressedFile.size >= file.size) {
                alert('压缩后文件反而变大，将保持原始大小！');
                compressedFile = file;
            }
            
            compressedPreview.src = URL.createObjectURL(compressedFile);
            compressedSize.textContent = formatFileSize(compressedFile.size);
        } catch (error) {
            console.error('压缩失败:', error);
            alert('图片压缩失败，请重试！');
        }
    }

    // 下载压缩后的图片
    downloadBtn.addEventListener('click', () => {
        if (!compressedFile) return;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedFile);
        link.download = `compressed_${originalFile.name}`;
        link.click();
    });

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 