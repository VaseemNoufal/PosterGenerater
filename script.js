const canvasEl = document.getElementById("posterCanvas");
const fabricCanvas = new fabric.Canvas("posterCanvas", {
  preserveObjectStacking: true,
  selection: false,
});

let uploadedImage; // Save reference

document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    fabric.Image.fromURL(event.target.result, function (img) {
      img.scaleToWidth(400); // adjust to fit better
      img.set({
        left: fabricCanvas.getWidth() / 2,
        top: fabricCanvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        cornerStyle: "circle",
        cornerColor: "blue",
      });

      // Remove old if exists
      if (uploadedImage) fabricCanvas.remove(uploadedImage);

      uploadedImage = img;
      fabricCanvas.add(uploadedImage);
      fabricCanvas.sendToBack(uploadedImage); // send it below the template
      fabricCanvas.setActiveObject(uploadedImage);
      fabricCanvas.renderAll();
    });
  };
  reader.readAsDataURL(file);
});

// Load template on top (AFTER canvas size is known)
const template = new Image();
template.src = "template.png"; // Your new template path

template.onload = () => {
  fabricCanvas.setWidth(template.width);
  fabricCanvas.setHeight(template.height);

  const bg = new fabric.Image(template, {
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
  });

  // Add to TOP always
  fabricCanvas.add(bg);
  fabricCanvas.bringToFront(bg);
};

document.getElementById("downloadBtn").addEventListener("click", () => {
  fabricCanvas.discardActiveObject();
  fabricCanvas.renderAll();

  const link = document.createElement("a");
  link.download = "poster.png";
  link.href = fabricCanvas.toDataURL({ format: "png" });
  link.click();
});
