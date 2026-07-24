/**
 * GBDS Profile Frame Generator
 * Uses assets/frame.png as top frame layer.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const canvasElement = document.getElementById('profile-canvas');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const imageInput = document.getElementById('image-input');
  const editorControls = document.getElementById('editor-controls');
  
  const btnChoose = document.getElementById('btn-choose');
  const btnDownload = document.getElementById('btn-download');
  const btnShare = document.getElementById('btn-share');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnRotateLeft = document.getElementById('btn-rotate-left');
  const btnRotateRight = document.getElementById('btn-rotate-right');
  const btnReset = document.getElementById('btn-reset');

  const CANVAS_SIZE = 1080;
  let fabricCanvas = null;
  let userImageObject = null;
  let frameImageObject = null;

  // Initialize Fabric Canvas
  function initCanvas() {
    fabricCanvas = new fabric.Canvas('profile-canvas', {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      selection: false,
      preserveObjectStacking: true,
      renderOnAddRemove: true
    });

    resizeCanvasViewport();
    window.addEventListener('resize', resizeCanvasViewport);

    // Load custom frame.png from assets
    loadFrameImage();
    
    // Pinch-Zoom & Touch Gestures
    setupTouchGestures();

    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 500);
  }

  function resizeCanvasViewport() {
    const container = document.getElementById('viewport-container');
    const scale = container.clientWidth / CANVAS_SIZE;
    
    fabricCanvas.setDimensions({
      width: container.clientWidth,
      height: container.clientWidth
    });
    fabricCanvas.setZoom(scale);
  }

  // Load assets/frame.png on top of canvas
  function loadFrameImage() {
    fabric.Image.fromURL('assets/frame.png', (img) => {
      frameImageObject = img;
      img.set({
        scaleX: CANVAS_SIZE / img.width,
        scaleY: CANVAS_SIZE / img.height,
        selectable: false,
        evented: false,
        left: 0,
        top: 0
      });
      fabricCanvas.add(img);
      fabricCanvas.bringToFront(img);
      fabricCanvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  }

  // Handle Photo Upload
  function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target.result, (img) => {
        if (userImageObject) {
          fabricCanvas.remove(userImageObject);
        }

        const scale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
        
        userImageObject = img;
        userImageObject.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: CANVAS_SIZE / 2,
          top: CANVAS_SIZE / 2,
          cornerStyle: 'circle',
          cornerColor: '#2563eb',
          cornerSize: 32,
          transparentCorners: false
        });

        fabricCanvas.add(userImageObject);
        
        if (frameImageObject) {
          fabricCanvas.bringToFront(frameImageObject);
        }
        
        fabricCanvas.setActiveObject(userImageObject);
        fabricCanvas.renderAll();

        uploadPlaceholder.classList.add('hidden');
        editorControls.style.display = 'flex';
        btnDownload.disabled = false;
        btnShare.disabled = false;
      });
    };
    reader.readAsDataURL(file);
  }

  // Prevent image from being dragged off-screen
  function enforceBoundaries(obj) {
    if (!obj) return;
    const bound = obj.getBoundingRect();
    const margin = 120;

    if (bound.left > CANVAS_SIZE - margin) obj.left = CANVAS_SIZE - margin + (obj.left - bound.left);
    if (bound.top > CANVAS_SIZE - margin) obj.top = CANVAS_SIZE - margin + (obj.top - bound.top);
    if (bound.left + bound.width < margin) obj.left = margin - bound.width + (obj.left - bound.left);
    if (bound.top + bound.height < margin) obj.top = margin - bound.height + (obj.top - bound.top);
  }

  fabricCanvas?.on('object:moving', (e) => enforceBoundaries(e.target));

  // Touch Pinch-Zoom Handler
  function setupTouchGestures() {
    let initialDistance = 0;
    let initialScale = 1;
    const container = document.getElementById('viewport-container');

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && userImageObject) {
        initialDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        initialScale = userImageObject.scaleX;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && userImageObject && initialDistance > 0) {
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const newScale = initialScale * (dist / initialDistance);
        userImageObject.setScaleX(newScale);
        userImageObject.setScaleY(newScale);
        fabricCanvas.renderAll();
      }
    }, { passive: true });

    container.addEventListener('touchend', () => { initialDistance = 0; }, { passive: true });
  }

  // Event Listeners
  btnChoose.addEventListener('click', () => imageInput.click());
  uploadPlaceholder.addEventListener('click', () => imageInput.click());

  imageInput.addEventListener('change', (e) => {
    if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
  });

  const viewport = document.getElementById('viewport-container');
  viewport.addEventListener('dragover', (e) => e.preventDefault());
  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
  });

  btnZoomIn.addEventListener('click', () => {
    if (!userImageObject) return;
    userImageObject.scale(userImageObject.scaleX * 1.1);
    fabricCanvas.renderAll();
  });

  btnZoomOut.addEventListener('click', () => {
    if (!userImageObject) return;
    userImageObject.scale(userImageObject.scaleX * 0.9);
    fabricCanvas.renderAll();
  });

  btnRotateLeft.addEventListener('click', () => {
    if (!userImageObject) return;
    userImageObject.rotate((userImageObject.angle || 0) - 15);
    fabricCanvas.renderAll();
  });

  btnRotateRight.addEventListener('click', () => {
    if (!userImageObject) return;
    userImageObject.rotate((userImageObject.angle || 0) + 15);
    fabricCanvas.renderAll();
  });

  btnReset.addEventListener('click', () => {
    if (!userImageObject) return;
    const scale = Math.max(CANVAS_SIZE / userImageObject.width, CANVAS_SIZE / userImageObject.height);
    userImageObject.set({
      scaleX: scale,
      scaleY: scale,
      left: CANVAS_SIZE / 2,
      top: CANVAS_SIZE / 2,
      angle: 0
    });
    fabricCanvas.renderAll();
  });

  // Download 1080x1080 PNG
  btnDownload.addEventListener('click', () => {
    if (!userImageObject) return;

    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: CANVAS_SIZE / fabricCanvas.getWidth()
    });

    const link = document.createElement('a');
    link.download = `GBDS_Founding_Day_Profile_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  });

  // Web Share
  btnShare.addEventListener('click', async () => {
    if (!userImageObject) return;

    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: CANVAS_SIZE / fabricCanvas.getWidth()
    });

    try {
      const blob = await (await fetch(dataURL)).blob();
      const file = new File([blob], 'gbds_profile_frame.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'GBDS Profile Frame',
          text: 'Celebrate GBDS Founding Day with me!',
          files: [file]
        });
      } else {
        btnDownload.click();
      }
    } catch (err) {
      console.log('Share canceled:', err);
    }
  });

  initCanvas();
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => console.log(err));
  });
}
