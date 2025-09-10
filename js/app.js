document.addEventListener('mousemove', (e) => {
    const parallaxBg = document.querySelector('.parallax-bg');
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    
    parallaxBg.style.transform = `translate(-${x/20}px, -${y/20}px)`;
});

window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    
    document.getElementById('scrollIndicator').style.width = scrollPercentage + '%';
});

class WallpaperManager {
    constructor() {
        this.wallpapers = [];
        this.currentWallpaper = null;
        
        this.initializeEventListeners();
        this.loadFromStorage();
        this.renderGallery();
    }

    initializeEventListeners() {
        const dropZone = document.querySelector('.drop-zone');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addImageFromUrl();
            }
        });

        document.body.addEventListener('backgroundchange', (e) => {
            const parallaxBg = document.querySelector('.parallax-bg');
            parallaxBg.style.backgroundImage = `url(${e.detail.imageUrl})`;
            parallaxBg.style.backgroundSize = 'cover';
            parallaxBg.style.backgroundPosition = 'center';
            parallaxBg.style.filter = 'blur(2px) brightness(0.7)';
        });
    }

    handleFiles(files) {
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const wallpaper = {
                        id: Date.now() + Math.random(),
                        url: e.target.result,
                        name: file.name,
                        type: 'file'
                    };
                    this.addWallpaper(wallpaper);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    addImageFromUrl() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        
        if (!url) return;
        
        if (!this.isValidImageUrl(url)) {
            this.showNotification('Por favor, ingresa una URL válida de imagen', 'error');
            return;
        }

        const wallpaper = {
            id: Date.now() + Math.random(),
            url: url,
            name: `Imagen ${this.wallpapers.length + 1}`,
            type: 'url'
        };

        this.addWallpaper(wallpaper);
        urlInput.value = '';
        this.showNotification('Imagen agregada exitosamente', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? 'rgba(231, 76, 60, 0.9)' : 'rgba(39, 174, 96, 0.9)'};
            color: white;
            border-radius: 10px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    isValidImageUrl(url) {
        const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)(\?.*)?$/i;
        return imageExtensions.test(url) || url.includes('imgur') || url.includes('unsplash') || url.includes('pexels');
    }

    addWallpaper(wallpaper) {
        this.wallpapers.push(wallpaper);
        this.saveToStorage();
        this.renderGallery();
    }

    editWallpaper(id) {
        const wallpaper = this.wallpapers.find(w => w.id === id);
        if (!wallpaper) return;

        const newUrl = prompt('Ingresa la nueva URL:', wallpaper.url);
        if (newUrl && newUrl !== wallpaper.url) {
            wallpaper.url = newUrl;
            wallpaper.type = 'url';
            this.saveToStorage();
            this.renderGallery();
            this.showNotification('Wallpaper actualizado', 'success');
        }
    }

    deleteWallpaper(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este wallpaper?')) {
            this.wallpapers = this.wallpapers.filter(w => w.id !== id);
            this.saveToStorage();
            this.renderGallery();
            this.showNotification('Wallpaper eliminado', 'success');
        }
    }

    setAsWallpaper(id) {
        const wallpaper = this.wallpapers.find(w => w.id === id);
        if (!wallpaper) return;

        this.currentWallpaper = wallpaper;
        document.getElementById('currentPreview').src = wallpaper.url;
        
        const event = new CustomEvent('backgroundchange', {
            detail: { imageUrl: wallpaper.url }
        });
        document.body.dispatchEvent(event);
        this.showNotification('Wallpaper aplicado', 'success');
    }

    downloadWallpaper(id) {
        const wallpaper = this.wallpapers.find(w => w.id === id);
        if (!wallpaper) return;

        const link = document.createElement('a');
        link.href = wallpaper.url;
        link.download = wallpaper.name || 'wallpaper.jpg';
        
        if (wallpaper.type === 'url') {
            fetch(wallpaper.url)
                .then(response => response.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    link.href = url;
                    link.click();
                    window.URL.revokeObjectURL(url);
                    this.showNotification('Descarga iniciada', 'success');
                })
                .catch(() => {
                    link.click();
                    this.showNotification('Descarga iniciada (método alternativo)', 'success');
                });
        } else {
            link.click();
            this.showNotification('Descarga iniciada', 'success');
        }
    }

    renderGallery() {
        const gallery = document.getElementById('gallery');
        
        if (this.wallpapers.length === 0) {
            gallery.innerHTML = `
                <div class="empty-state">
                    <h3>🖼️ No hay wallpapers</h3>
                    <p>Agrega algunas imágenes para comenzar tu colección</p>
                </div>
            `;
            return;
        }

        gallery.innerHTML = this.wallpapers.map(wallpaper => {
            return `
                <div class="wallpaper-card">
                    <img class="wallpaper-image" src="${wallpaper.url}" alt="${wallpaper.name}" 
                         onclick="wallpaperManager.setAsWallpaper(${wallpaper.id})"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'320\\' height=\\'220\\'%3E%3Crect width=\\'320\\' height=\\'220\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'160\\' y=\\'110\\' text-anchor=\\'middle\\' fill=\\'%23999\\' font-size=\\'14\\'%3EError al cargar imagen%3C/text%3E%3C/svg%3E'">
                    <div class="wallpaper-actions">
                        <button class="btn btn-small btn-warning" onclick="openImageEditor(${wallpaper.id})" title="Editar imagen con filtros">✏️ Editar</button>
                        <button class="btn btn-small btn-success" onclick="wallpaperManager.setAsWallpaper(${wallpaper.id})" title="Aplicar como fondo">🖼️ Aplicar</button>
                        <button class="btn btn-small" onclick="wallpaperManager.downloadWallpaper(${wallpaper.id})" title="Descargar imagen">💾 Descargar</button>
                        <button class="btn btn-small btn-danger" onclick="wallpaperManager.deleteWallpaper(${wallpaper.id})" title="Eliminar wallpaper">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');

        const cards = gallery.querySelectorAll('.wallpaper-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.style.animation = 'fadeInUp 0.6s ease forwards';
        });
    }

    saveToStorage() {
        const data = {
            wallpapers: this.wallpapers,
            currentWallpaper: this.currentWallpaper
        };
        console.log('Datos guardados en memoria:', data);
    }

    loadFromStorage() {
        const sampleWallpapers = [
            {
                id: 1,
                url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
                name: 'Montañas al amanecer',
                type: 'url'
            },
            {
                id: 2,
                url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
                name: 'Bosque místico',
                type: 'url'
            },
            {
                id: 3,
                url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80',
                name: 'Océano sereno',
                type: 'url'
            },
            {
                id: 4,
                url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80',
                name: 'Galaxia estrellada',
                type: 'url'
            }
        ];
        if (this.wallpapers.length === 0) {
            this.wallpapers = sampleWallpapers;
        }
    }
}
class ImageEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalImageData = null;
        this.currentImageData = null;
        this.currentWallpaper = null;
        this.filters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            gamma: 1
        };
        this.currentFilter = 'none';
        this.transformations = {
            rotation: 0,
            flipH: false,
            flipV: false
        };
    }

    init() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
    }

    open(wallpaper) {
        this.currentWallpaper = wallpaper;
        this.resetFilters();
        
        const modal = document.getElementById('editorModal');
        modal.classList.add('active');
        modal.style.display = 'flex';
        
        this.loadImage(wallpaper.url);
    }

    close() {
        const modal = document.getElementById('editorModal');
        modal.classList.remove('active');
        modal.style.display = 'none';
        
        this.currentWallpaper = null;
        this.originalImageData = null;
        this.currentImageData = null;
    }

    loadImage(src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const maxWidth = 600;
            const maxHeight = 400;
            
            let { width, height } = this.calculateAspectRatio(
                img.width, img.height, maxWidth, maxHeight
            );
            
            this.canvas.width = width;
            this.canvas.height = height;
            
            this.ctx.drawImage(img, 0, 0, width, height);
            this.originalImageData = this.ctx.getImageData(0, 0, width, height);
            this.currentImageData = this.ctx.getImageData(0, 0, width, height);
        };
        
        img.onerror = () => {
            this.showNotification('Error al cargar la imagen', 'error');
        };
        
        img.src = src;
    }

    calculateAspectRatio(imgWidth, imgHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        return {
            width: Math.round(imgWidth * ratio),
            height: Math.round(imgHeight * ratio)
        };
    }

    resetFilters() {
        this.filters = { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1 };
        this.currentFilter = 'none';
        this.transformations = { rotation: 0, flipH: false, flipV: false };
        
        // Reset sliders
        document.getElementById('brightness').value = 0;
        document.getElementById('contrast').value = 0;
        document.getElementById('saturation').value = 0;
        document.getElementById('hue').value = 0;
        document.getElementById('gamma').value = 1;
        
        // Reset value displays
        document.getElementById('brightnessValue').textContent = '0';
        document.getElementById('contrastValue').textContent = '0';
        document.getElementById('saturationValue').textContent = '0';
        document.getElementById('hueValue').textContent = '0';
        document.getElementById('gammaValue').textContent = '1.0';
    }

    applyFilter(filterType) {
        if (!this.originalImageData) return;
        
        this.currentFilter = filterType;
        let imageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );
        
        switch (filterType) {
            case 'grayscale':
                imageData = this.grayscaleFilter(imageData);
                break;
            case 'sepia':
                imageData = this.sepiaFilter(imageData);
                break;
            case 'vintage':
                imageData = this.vintageFilter(imageData);
                break;
            case 'cool':
                imageData = this.coolFilter(imageData);
                break;
            case 'warm':
                imageData = this.warmFilter(imageData);
                break;
            case 'blur':
                imageData = this.blurFilter(imageData);
                break;
            case 'vignette':
                imageData = this.vignetteFilter(imageData);
                break;
            case 'sharpen':
                imageData = this.sharpenFilter(imageData);
                break;
            case 'emboss':
                imageData = this.embossFilter(imageData);
                break;
            case 'red':
                imageData = this.colorFilter(imageData, 'red');
                break;
            case 'green':
                imageData = this.colorFilter(imageData, 'green');
                break;
            case 'blue':
                imageData = this.colorFilter(imageData, 'blue');
                break;
            case 'purple':
                imageData = this.colorFilter(imageData, 'purple');
                break;
        }
        
        this.currentImageData = imageData;
        this.applyAdjustments();
    }

    grayscaleFilter(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
        return imageData;
    }

    sepiaFilter(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        return imageData;
    }

    vintageFilter(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= 1.2;     
            data[i + 1] *= 1.1;  
            data[i + 2] *= 0.8; 
        }
        return imageData;
    }

    coolFilter(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= 0.8;     
            data[i + 1] *= 1.1; 
            data[i + 2] *= 1.3; 
        }
        return imageData;
    }

    warmFilter(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] *= 1.3;     
            data[i + 1] *= 1.1; 
            data[i + 2] *= 0.8; 
        }
        return imageData;
    }

    blurFilter(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
        const kernelSum = 16;
        
        const output = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                let r = 0, g = 0, b = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const kidx = ((y + ky) * width + (x + kx)) * 4;
                        const k = kernel[(ky + 1) * 3 + (kx + 1)];
                        r += data[kidx] * k;
                        g += data[kidx + 1] * k;
                        b += data[kidx + 2] * k;
                    }
                }
                
                output[idx] = r / kernelSum;
                output[idx + 1] = g / kernelSum;
                output[idx + 2] = b / kernelSum;
            }
        }
        
        return new ImageData(output, width, height);
    }

    vignetteFilter(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
                const vignette = Math.max(0, 1 - (distance / maxDistance) * 1.5);
                
                data[idx] *= vignette;
                data[idx + 1] *= vignette;
                data[idx + 2] *= vignette;
            }
        }
        
        return imageData;
    }

    sharpenFilter(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        
        const output = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                let r = 0, g = 0, b = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const kidx = ((y + ky) * width + (x + kx)) * 4;
                        const k = kernel[(ky + 1) * 3 + (kx + 1)];
                        r += data[kidx] * k;
                        g += data[kidx + 1] * k;
                        b += data[kidx + 2] * k;
                    }
                }
                
                output[idx] = Math.max(0, Math.min(255, r));
                output[idx + 1] = Math.max(0, Math.min(255, g));
                output[idx + 2] = Math.max(0, Math.min(255, b));
            }
        }
        
        return new ImageData(output, width, height);
    }

    embossFilter(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
        
        const output = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                let r = 0, g = 0, b = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const kidx = ((y + ky) * width + (x + kx)) * 4;
                        const k = kernel[(ky + 1) * 3 + (kx + 1)];
                        r += data[kidx] * k;
                        g += data[kidx + 1] * k;
                        b += data[kidx + 2] * k;
                    }
                }
                
                output[idx] = Math.max(0, Math.min(255, r + 128));
                output[idx + 1] = Math.max(0, Math.min(255, g + 128));
                output[idx + 2] = Math.max(0, Math.min(255, b + 128));
            }
        }
        
        return new ImageData(output, width, height);
    }

    colorFilter(imageData, color) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            switch (color) {
                case 'red':
                    data[i] = Math.min(255, data[i] * 1.5);
                    data[i + 1] *= 0.7;
                    data[i + 2] *= 0.7;
                    break;
                case 'green':
                    data[i] *= 0.7;
                    data[i + 1] = Math.min(255, data[i + 1] * 1.5);
                    data[i + 2] *= 0.7;
                    break;
                case 'blue':
                    data[i] *= 0.7;
                    data[i + 1] *= 0.7;
                    data[i + 2] = Math.min(255, data[i + 2] * 1.5);
                    break;
                case 'purple':
                    data[i] = Math.min(255, data[i] * 1.3);
                    data[i + 1] *= 0.8;
                    data[i + 2] = Math.min(255, data[i + 2] * 1.3);
                    break;
            }
        }
        
        return imageData;
    }

    applyAdjustments() {
        if (!this.currentImageData) return;
        
        let imageData = new ImageData(
            new Uint8ClampedArray(this.currentImageData.data),
            this.currentImageData.width,
            this.currentImageData.height
        );
        
        const data = imageData.data;
        const { brightness, contrast, saturation, hue, gamma } = this.filters;
        
        for (let i = 0; i < data.length; i += 4) {
            let [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            
            if (gamma !== 1) {
                r = Math.pow(r / 255, gamma) * 255;
                g = Math.pow(g / 255, gamma) * 255;
                b = Math.pow(b / 255, gamma) * 255;
            }
            
            r = Math.max(0, Math.min(255, r + brightness));
            g = Math.max(0, Math.min(255, g + brightness));
            b = Math.max(0, Math.min(255, b + brightness));
            
            const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
            g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
            b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
            if (saturation !== 0 || hue !== 0) {
                let hsv = this.rgbToHsv(r, g, b);
                hsv[1] = Math.max(0, Math.min(1, hsv[1] + saturation / 100));
                hsv[0] = (hsv[0] + hue / 180) % 1;
                if (hsv[0] < 0) hsv[0] += 1;
                [r, g, b] = this.hsvToRgb(hsv[0], hsv[1], hsv[2]);
            }
            
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const h = max === min ? 0 : 
                  max === r ? ((g - b) / (max - min) + 6) % 6 / 6 :
                  max === g ? ((b - r) / (max - min) + 2) / 6 :
                             ((r - g) / (max - min) + 4) / 6;
        const s = max === 0 ? 0 : (max - min) / max;
        const v = max;
        return [h, s, v];
    }

    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = v - c;
        let r, g, b;
        
        if (h < 1/6) [r, g, b] = [c, x, 0];
        else if (h < 2/6) [r, g, b] = [x, c, 0];
        else if (h < 3/6) [r, g, b] = [0, c, x];
        else if (h < 4/6) [r, g, b] = [0, x, c];
        else if (h < 5/6) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }

    updateAdjustments() {
        this.filters.brightness = parseInt(document.getElementById('brightness').value);
        this.filters.contrast = parseInt(document.getElementById('contrast').value);
        this.filters.saturation = parseInt(document.getElementById('saturation').value);
        this.filters.hue = parseInt(document.getElementById('hue').value);
        this.filters.gamma = parseFloat(document.getElementById('gamma').value);
        document.getElementById('brightnessValue').textContent = this.filters.brightness;
        document.getElementById('contrastValue').textContent = this.filters.contrast;
        document.getElementById('saturationValue').textContent = this.filters.saturation;
        document.getElementById('hueValue').textContent = this.filters.hue;
        document.getElementById('gammaValue').textContent = this.filters.gamma.toFixed(1);
        
        this.applyAdjustments();
    }

    rotateImage(degrees) {
        if (!this.originalImageData) return;
        
        this.transformations.rotation += degrees;
        this.redrawWithTransformations();
    }

    flipImage(direction) {
        if (!this.originalImageData) return;
        
        if (direction === 'horizontal') {
            this.transformations.flipH = !this.transformations.flipH;
        } else {
            this.transformations.flipV = !this.transformations.flipV;
        }
        
        this.redrawWithTransformations();
    }

    redrawWithTransformations() {
        const { rotation, flipH, flipV } = this.transformations;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.originalImageData.width;
        tempCanvas.height = this.originalImageData.height;
        tempCtx.putImageData(this.originalImageData, 0, 0);
        
        const isRotated = rotation % 180 !== 0;
        if (isRotated) {
            this.canvas.width = this.originalImageData.height;
            this.canvas.height = this.originalImageData.width;
        } else {
            this.canvas.width = this.originalImageData.width;
            this.canvas.height = this.originalImageData.height;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate((rotation * Math.PI) / 180);
        this.ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        this.ctx.drawImage(
            tempCanvas,
            -tempCanvas.width / 2,
            -tempCanvas.height / 2
        );
        this.ctx.restore();
        
        this.currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        this.applyFilter(this.currentFilter);
    }

    resetImage() {
        if (!this.originalImageData) return;
        
        this.resetFilters();
        this.transformations = { rotation: 0, flipH: false, flipV: false };
        
        this.canvas.width = this.originalImageData.width;
        this.canvas.height = this.originalImageData.height;
        this.ctx.putImageData(this.originalImageData, 0, 0);
        this.currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        this.showNotification('Imagen restablecida', 'success');
    }

    startCrop() {
        this.showNotification('Funcionalidad de recorte disponible próximamente', 'info');
    }

    addText() {
        const text = prompt('Ingresa el texto a agregar:');
        if (!text) return;
        
        const fontSize = prompt('Tamaño de fuente (px):', '30');
        if (!fontSize) return;
        
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        this.ctx.strokeText(text, x - this.ctx.measureText(text).width / 2, y);
        this.ctx.fillText(text, x - this.ctx.measureText(text).width / 2, y);
        
        this.showNotification('Texto agregado', 'success');
    }

    addBorder() {
        const borderWidth = parseInt(prompt('Ancho del borde (px):', '10'));
        if (!borderWidth || borderWidth <= 0) return;
        
        const borderColor = prompt('Color del borde (hex):', '#ffffff');
        if (!borderColor) return;
        
        const newWidth = this.canvas.width + (borderWidth * 2);
        const newHeight = this.canvas.height + (borderWidth * 2);
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        

        tempCtx.fillStyle = borderColor;
        tempCtx.fillRect(0, 0, newWidth, newHeight);
        
        tempCtx.drawImage(this.canvas, borderWidth, borderWidth);
        

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        this.showNotification('Borde agregado', 'success');
    }

    resizeImage() {
        const newWidth = parseInt(prompt('Nuevo ancho (px):', this.canvas.width));
        if (!newWidth || newWidth <= 0) return;
        
        const newHeight = parseInt(prompt('Nueva altura (px):', this.canvas.height));
        if (!newHeight || newHeight <= 0) return;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
        
        this.showNotification('Imagen redimensionada', 'success');
    }

    saveEditedImage() {
        if (!this.canvas || !this.currentWallpaper) return;
        
        const editedImageData = this.canvas.toDataURL('image/png');
        this.currentWallpaper.url = editedImageData;
        this.currentWallpaper.type = 'edited';
        this.currentWallpaper.name = this.currentWallpaper.name + ' (editado)';

        wallpaperManager.saveToStorage();
        wallpaperManager.renderGallery();
        
        this.showNotification('Cambios guardados exitosamente', 'success');
        this.close();
    }

    downloadEditedImage() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = (this.currentWallpaper?.name || 'imagen') + '_editado.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        this.showNotification('Imagen descargada', 'success');
    }

    showNotification(message, type) {
        if (wallpaperManager) {
            wallpaperManager.showNotification(message, type);
        }
    }
}
let imageEditor;
let wallpaperManager;

function addImageFromUrl() {
    wallpaperManager.addImageFromUrl();
}
function openImageEditor(wallpaperId) {
    const wallpaper = wallpaperManager.wallpapers.find(w => w.id === wallpaperId);
    if (!wallpaper) return;
    
    if (!imageEditor) {
        imageEditor = new ImageEditor();
        imageEditor.init();
    }
    
    imageEditor.open(wallpaper);
}

function closeImageEditor() {
    if (imageEditor) {
        imageEditor.close();
    }
}

function applyFilter(filterType) {
    if (imageEditor) {
        imageEditor.applyFilter(filterType);
    }
}

function updateImageAdjustments() {
    if (imageEditor) {
        imageEditor.updateAdjustments();
    }
}

function rotateImage(degrees) {
    if (imageEditor) {
        imageEditor.rotateImage(degrees);
    }
}

function flipImage(direction) {
    if (imageEditor) {
        imageEditor.flipImage(direction);
    }
}

function resetImage() {
    if (imageEditor) {
        imageEditor.resetImage();
    }
}

function saveEditedImage() {
    if (imageEditor) {
        imageEditor.saveEditedImage();
    }
}

function downloadEditedImage() {
    if (imageEditor) {
        imageEditor.downloadEditedImage();
    }
}
function startCrop() {
    if (imageEditor) {
        imageEditor.startCrop();
    }
}

function addText() {
    if (imageEditor) {
        imageEditor.addText();
    }
}

function addBorder() {
    if (imageEditor) {
        imageEditor.addBorder();
    }
}

function resizeImage() {
    if (imageEditor) {
        imageEditor.resizeImage();
    }
}
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .wallpaper-card {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
}


document.addEventListener('DOMContentLoaded', () => {
    addDynamicStyles();
    wallpaperManager = new WallpaperManager();
    setTimeout(() => {
        const header = document.querySelector('.header');
        if (header) {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }
    }, 300);
});
document.documentElement.style.scrollBehavior = 'smooth';