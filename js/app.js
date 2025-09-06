const wallpaperContainer = document.getElementById("wallpaperContainer");
const wallpaperForm = document.getElementById("wallpaperForm");
const urlInput = document.getElementById("urlInput");
const mainWallpaper = document.getElementById("mainWallpaper");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const randomBtn = document.getElementById("randomBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const closeBtn = document.getElementById("closeBtn");

menuBtn.addEventListener("click", () => sidebar.classList.add("open"));
closeBtn.addEventListener("click", () => sidebar.classList.remove("open"));

let wallpapers = [
  "https://picsum.photos/800/600?random=1",
  "https://picsum.photos/800/600?random=2",
  "https://picsum.photos/800/600?random=3"
];

function renderWallpapers() {
  wallpaperContainer.innerHTML = "";
  wallpapers.forEach((url, index) => {
    const div = document.createElement("div");
    div.classList.add("wallpaper");
    div.innerHTML = `
      <img src="${url}" alt="Wallpaper ${index + 1}">
      <button onclick="setAsBackground('${url}')">Fondo</button>
      <button onclick="deleteWallpaper(${index})">X</button>
    `;
    wallpaperContainer.appendChild(div);
  });
}

wallpaperForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (url) {
    wallpapers.push(url);
    urlInput.value = "";
    renderWallpapers();
  }
});

fileInput.addEventListener("change", (e) => {
  const files = e.target.files;
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      wallpapers.push(ev.target.result);
      renderWallpapers();
    };
    reader.readAsDataURL(file);
  }
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const files = e.dataTransfer.files;
  for (let file of files) {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        wallpapers.push(ev.target.result);
        renderWallpapers();
      };
      reader.readAsDataURL(file);
    }
  }
});

function deleteWallpaper(index) {
  wallpapers.splice(index, 1);
  renderWallpapers();
}

function setAsBackground(url) {
  mainWallpaper.style.backgroundImage = `url('${url}')`;
}

randomBtn.addEventListener("click", () => {
  if (wallpapers.length > 0) {
    const randomIndex = Math.floor(Math.random() * wallpapers.length);
    setAsBackground(wallpapers[randomIndex]);
  }
});

renderWallpapers();
setAsBackground(wallpapers[0]); 
