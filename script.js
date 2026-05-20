const canvasEl = document.getElementById("posterCanvas");
const fabricCanvas = new fabric.Canvas("posterCanvas", {
  preserveObjectStacking: true,
  selection: false,
});

// Global Variables
let uploadedImage; 
let cropper; 
let templateObj; 
let watermarkObj; // Tracks the text watermark
let lastCropData = null; 

const posterCropRatio = 1; 

// DOM Elements
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const closeCropModal = document.getElementById('closeCropModal');
const cropBtn = document.getElementById('cropBtn');
const fileInput = document.getElementById("upload");
const reCropBtn = document.getElementById("reCropBtn"); 
const shareWhatsAppBtn = document.getElementById("shareWhatsAppBtn");

// 1. Listen for file upload
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  document.getElementById("fileName").textContent = file ? file.name : "No file chosen";

  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    cropImage.src = event.target.result;
    cropModal.classList.add('active');

    if (cropper) {
      cropper.destroy();
    }
    
    lastCropData = null;

    cropper = new Cropper(cropImage, {
      aspectRatio: posterCropRatio,
      viewMode: 1, 
      autoCropArea: 0.9,
      minCropBoxWidth: 100,  
      minCropBoxHeight: 100, 
    });
  };
  reader.readAsDataURL(file);
  e.target.value = ''; 
});

// 2. Close Modal Logic
closeCropModal.addEventListener("click", () => {
  cropModal.classList.remove('active');
  if (cropper) cropper.destroy();
});

// 3. Handle Crop & Apply Button
cropBtn.addEventListener("click", () => {
  if (!cropper) return;

  lastCropData = cropper.getData(); 
  
  // Show BOTH the Edit Crop and WhatsApp buttons
  reCropBtn.style.display = "inline-block";
  shareWhatsAppBtn.style.display = "inline-block";

  const croppedCanvas = cropper.getCroppedCanvas({
    width: 800, 
  });

  const croppedDataUrl = croppedCanvas.toDataURL("image/png");

  fabric.Image.fromURL(croppedDataUrl, function (img) {
    img.set({
      left: fabricCanvas.getWidth() / 2,
      top: fabricCanvas.getHeight() / 2,
      originX: "center",
      originY: "center",
      selectable: false, 
      evented: false,    
    });

    const scaleFactor = (fabricCanvas.getWidth() * 0.95) / img.width;
    img.scale(scaleFactor);

    if (uploadedImage) fabricCanvas.remove(uploadedImage);

    uploadedImage = img;
    fabricCanvas.add(uploadedImage);
    
    // Z-Index Layering: Photo back, Template middle, Watermark top
    fabricCanvas.sendToBack(uploadedImage);
    if (templateObj) {
      templateObj.bringToFront();
    }
    if (watermarkObj) {
      watermarkObj.bringToFront();
    }
    
    fabricCanvas.renderAll();
  });

  cropModal.classList.remove('active');
  cropper.destroy();
});

// 4. Handle Edit Crop (Re-crop) Button
reCropBtn.addEventListener("click", () => {
  cropModal.classList.add('active');

  if (cropper) {
    cropper.destroy();
  }

  cropper = new Cropper(cropImage, {
    aspectRatio: posterCropRatio,
    viewMode: 1,
    autoCropArea: 0.9,
    minCropBoxWidth: 100,  
    minCropBoxHeight: 100,
    ready: function () {
      if (lastCropData) {
        cropper.setData(lastCropData);
      }
    }
  });
});

// 5. Load Template and Watermark Text
const template = new Image();
template.src = "template.png"; 

template.onload = () => {
  fabricCanvas.setWidth(template.width);
  fabricCanvas.setHeight(template.height);

  templateObj = new fabric.Image(template, {
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
  });

  fabricCanvas.add(templateObj);
  
  // Create Watermark Text
  watermarkObj = new fabric.Text('Make yours at: mhmposter.vercel.app', {
    left: fabricCanvas.getWidth() / 2,
    top: fabricCanvas.getHeight() - 30, // Tucked cleanly at the bottom
    fontSize: 18,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fill: '#ffffff', // Clean white text
    originX: 'center',
    selectable: false,
    evented: false,
    shadow: new fabric.Shadow({
      color: 'rgba(0,0,0,0.8)', // Drop shadow ensures it can be read over light or dark backgrounds
      blur: 4,
      offsetX: 1,
      offsetY: 1
    })
  });
  
  fabricCanvas.add(watermarkObj);

  // Lock them to the top layer
  fabricCanvas.bringToFront(templateObj);
  fabricCanvas.bringToFront(watermarkObj);
};

// 6. Download button
document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "poster.png";
  link.href = fabricCanvas.toDataURL({ format: "png" });
  link.click();
});

// 7. WhatsApp Share Feature
shareWhatsAppBtn.addEventListener("click", async () => {
  fabricCanvas.discardActiveObject();
  fabricCanvas.renderAll();

  // We leave a generic message for the text field just in case
  const shareText = "Create your own personalized Eid Poster at https://mhmposter.vercel.app/";

  if (navigator.share) {
    try {
      const dataUrl = fabricCanvas.toDataURL({ format: "png" });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'my-poster.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Poster',
          text: shareText, 
          files: [file]
        });
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
      }
    } catch (error) {
      console.log('Share canceled or failed:', error);
    }
  } else {
    alert("Direct image sharing isn't supported on this browser. You can download the poster and send it manually!");
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  }
});