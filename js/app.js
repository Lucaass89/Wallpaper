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
        this.selectedWallpapers = new Set();
        this.slideshowInterval = null;
        this.slideshowIndex = 0;
        this.isSlideshow = false;
        
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
            this.selectedWallpapers.delete(id);
            this.saveToStorage();
            this.renderGallery();
            this.updateSelectedCount();
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

    toggleWallpaperSelection(id) {
        if (this.selectedWallpapers.has(id)) {
            this.selectedWallpapers.delete(id);
        } else {
            this.selectedWallpapers.add(id);
        }
        this.updateSelectedCount();
        this.renderGallery();
    }

    selectAllWallpapers() {
        this.wallpapers.forEach(w => this.selectedWallpapers.add(w.id));
        this.updateSelectedCount();
        this.renderGallery();
        this.showNotification(`${this.wallpapers.length} wallpapers seleccionados`, 'success');
    }

    clearSelection() {
        this.selectedWallpapers.clear();
        this.updateSelectedCount();
        this.renderGallery();
        this.showNotification('Selección limpiada', 'info');
    }

    toggleSlideshow() {
        if (this.isSlideshow) {
            this.stopSlideshow();
        } else {
            this.startSlideshow();
        }
    }

    startSlideshow() {
        if (this.selectedWallpapers.size === 0) {
            this.showNotification('Selecciona al menos un wallpaper para el slideshow', 'error');
            return;
        }

        this.isSlideshow = true;
        this.slideshowIndex = 0;
        const selectedIds = Array.from(this.selectedWallpapers);
        
        this.setAsWallpaper(selectedIds[0]);
        
        this.slideshowInterval = setInterval(() => {
            this.slideshowIndex = (this.slideshowIndex + 1) % selectedIds.length;
            this.setAsWallpaper(selectedIds[this.slideshowIndex]);
        }, 5000);

        document.getElementById('slideshowBtn').innerHTML = '⏹️ Detener Slideshow';
        document.getElementById('slideshowBtn').className = 'btn btn-danger';
        this.showNotification('Slideshow iniciado', 'success');
    }

    stopSlideshow() {
        this.isSlideshow = false;
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
        
        document.getElementById('slideshowBtn').innerHTML = '▶️ Iniciar Slideshow';
        document.getElementById('slideshowBtn').className = 'btn';
        this.showNotification('Slideshow detenido', 'info');
    }

    updateSelectedCount() {
        document.getElementById('selectedCount').textContent = this.selectedWallpapers.size;
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
            const isSelected = this.selectedWallpapers.has(wallpaper.id);
            const selectedStyle = isSelected ? 'style="border: 2px solid rgba(39, 174, 96, 0.8); box-shadow: 0 0 20px rgba(39, 174, 96, 0.3);"' : '';
            
            return `
                <div class="wallpaper-card" ${selectedStyle}>
                    <img class="wallpaper-image" src="${wallpaper.url}" alt="${wallpaper.name}" 
                         onclick="wallpaperManager.setAsWallpaper(${wallpaper.id})"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'320\\' height=\\'220\\'%3E%3Crect width=\\'320\\' height=\\'220\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'160\\' y=\\'110\\' text-anchor=\\'middle\\' fill=\\'%23999\\' font-size=\\'14\\'%3EError al cargar imagen%3C/text%3E%3C/svg%3E'">
                    <div class="wallpaper-actions">
                        <button class="btn btn-small btn-warning" onclick="wallpaperManager.editWallpaper(${wallpaper.id})" title="Editar wallpaper">✏️ Editar</button>
                        <button class="btn btn-small btn-danger" onclick="wallpaperManager.deleteWallpaper(${wallpaper.id})" title="Eliminar wallpaper">🗑️ Eliminar</button>
                        <button class="btn btn-small btn-success" onclick="wallpaperManager.setAsWallpaper(${wallpaper.id})" title="Aplicar como fondo">🖼️ Aplicar</button>
                        <button class="btn btn-small" onclick="wallpaperManager.downloadWallpaper(${wallpaper.id})" title="Descargar imagen">💾 Descargar</button>
                        <button class="btn btn-small ${isSelected ? 'btn-success' : ''}" onclick="wallpaperManager.toggleWallpaperSelection(${wallpaper.id})" title="${isSelected ? 'Desseleccionar' : 'Seleccionar para slideshow'}">
                            ${isSelected ? '✅ Seleccionado' : '⭕ Seleccionar'}
                        </button>
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

let wallpaperManager;

function addImageFromUrl() {
    wallpaperManager.addImageFromUrl();
}

function toggleSlideshow() {
    wallpaperManager.toggleSlideshow();
}

function selectAllWallpapers() {
    wallpaperManager.selectAllWallpapers();
}

function clearSelection() {
    wallpaperManager.clearSelection();
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