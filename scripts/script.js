document.addEventListener('DOMContentLoaded', () => {
  const fileArea = document.querySelector('.file-area');
  const uploadedImg = document.querySelector('.uploaded-img-holder');
  const crop = document.querySelector('.crop-overlay');
  const overlay = document.querySelector('.dim-overlay');
  const imgRangeSize = document.querySelector('.range-field');
  const inputFile = document.getElementById('inputImage');
  const downloadBtn = document.querySelector('.download-btn');
  const qualitySelect = document.getElementById('export-quality');
  const demoThumbs = document.querySelectorAll('.demo-thumb');

  if (!fileArea || !uploadedImg) return;

  const hasOverlay = Boolean(crop && overlay);

  let isDragging = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startImgLeft = 0;
  let startImgTop = 0;

  let currentScale = 1;
  const minScale = 0.7;
  const maxScale = 3;
  const zoomSpeed = 0.0055;

  function getRects() {
    return {
      containerRect: fileArea.getBoundingClientRect(),
      imgRect: uploadedImg.getBoundingClientRect(),
    };
  }

  function clampAndApply(left, top) {
    const { containerRect, imgRect } = getRects();
    const spanX = containerRect.width - imgRect.width;
    const spanY = containerRect.height - imgRect.height;

    let finalLeft;
    let finalTop;

    if (spanX <= 0) {
      finalLeft = Math.min(Math.max(left, spanX), 0);
    } else {
      finalLeft = left;
    }

    if (spanY <= 0) {
      finalTop = Math.min(Math.max(top, spanY), 0);
    } else {
      finalTop = top;
    }

    uploadedImg.style.left = `${finalLeft}px`;
    uploadedImg.style.top = `${finalTop}px`;
  }

  function ensureInitialPosition() {
    requestAnimationFrame(() => {
      const { containerRect, imgRect } = getRects();
      const left = (containerRect.width - imgRect.width) / 2;
      const top = (containerRect.height - imgRect.height) / 2;

      uploadedImg.style.left = `${left}px`;
      uploadedImg.style.top = `${top}px`;

      clampAndApply(left, top);
      if (hasOverlay) scheduleOverlay();
    });
  }

  function applyScale() {
    uploadedImg.style.transformOrigin = 'center center';
    uploadedImg.style.transform = `scale(${currentScale})`;

    requestAnimationFrame(() => {
      const style = getComputedStyle(uploadedImg);
      clampAndApply(parseFloat(style.left) || 0, parseFloat(style.top) || 0);
      if (hasOverlay) scheduleOverlay();
    });
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const style = getComputedStyle(uploadedImg);
    startImgLeft = parseFloat(style.left) || 0;
    startImgTop = parseFloat(style.top) || 0;

    startPointerX = e.clientX;
    startPointerY = e.clientY;

    isDragging = true;
    fileArea.classList.add('grabbing');
    try {
      fileArea.setPointerCapture(e.pointerId);
    } catch (err) {
      // some browsers may throw if pointer capture isn't supported
    }
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = (e.clientX - startPointerX) / currentScale;
    const dy = (e.clientY - startPointerY) / currentScale;
    clampAndApply(startImgLeft + dx, startImgTop + dy);
    if (hasOverlay) scheduleOverlay();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    fileArea.classList.remove('grabbing');
    try {
      fileArea.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore if not supported
    }
  }

  fileArea.addEventListener('pointerdown', onPointerDown);
  fileArea.addEventListener('pointermove', onPointerMove);
  fileArea.addEventListener('pointerup', onPointerUp);
  fileArea.addEventListener('pointercancel', onPointerUp);

  function updateOverlayNow() {
    if (!hasOverlay) return;
    const fileRect = fileArea.getBoundingClientRect();
    const cropRect = crop.getBoundingClientRect();

    overlay.style.setProperty('--cx', `${cropRect.left - fileRect.left + cropRect.width / 2}px`);
    overlay.style.setProperty('--cy', `${cropRect.top - fileRect.top + cropRect.height / 2}px`);
    overlay.style.setProperty('--r', `${Math.max(cropRect.width, cropRect.height) / 2}px`);
  }

  let overlayTick = false;
  function scheduleOverlay() {
    if (overlayTick) return;
    overlayTick = true;
    requestAnimationFrame(() => {
      updateOverlayNow();
      overlayTick = false;
    });
  }

  if (hasOverlay && crop) {
    const mo = new MutationObserver(scheduleOverlay);
    mo.observe(crop, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  if (imgRangeSize) {
    imgRangeSize.addEventListener('input', () => {
      currentScale = Math.min(maxScale, Math.max(minScale, +imgRangeSize.value));
      applyScale();
    });
  }

  fileArea.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      const delta = -(e.deltaY + e.deltaX);
      currentScale = Math.min(maxScale, Math.max(minScale, currentScale + delta * zoomSpeed));
      if (imgRangeSize) imgRangeSize.value = currentScale.toFixed(3);
      applyScale();
    },
    { passive: false },
  );

  if (inputFile) {
    inputFile.addEventListener('change', e => {
      const cropWrapper = document.querySelector('.crop-img-area');
      if (!cropWrapper) return;
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      cropWrapper.classList.remove('hide');
      currentScale = 1;
      if (imgRangeSize) imgRangeSize.value = 1;
      uploadedImg.style.transform = 'scale(1)';

      if (uploadedImg._objectURL) {
        URL.revokeObjectURL(uploadedImg._objectURL);
        uploadedImg._objectURL = null;
      }

      uploadedImg._objectURL = URL.createObjectURL(file);
      uploadedImg.src = uploadedImg._objectURL;
      uploadedImg.onload = () => ensureInitialPosition();
    });
  }

  if (demoThumbs && demoThumbs.length) {
    demoThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.getAttribute('src') || thumb.dataset.src;
        if (!src) return;
        const cropWrapper = document.querySelector('.crop-img-area');
        if (!cropWrapper) return;

        cropWrapper.classList.remove('hide');
        currentScale = 1;
        if (imgRangeSize) imgRangeSize.value = 1;
        uploadedImg.style.transform = 'scale(1)';

        uploadedImg.src = src;
        uploadedImg.onload = () => ensureInitialPosition();

        // quick visual feedback
        thumb.classList.add('thumb-active');
        setTimeout(() => thumb.classList.remove('thumb-active'), 300);
      });
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!uploadedImg.src) return;

      const originalContent = downloadBtn.innerHTML;
      downloadBtn.classList.add('is-processing');

      const statusSpan = downloadBtn.querySelector('span');
      if (statusSpan) statusSpan.innerText = 'Processing 4K Image...';

      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const cropRect = crop.getBoundingClientRect();
          const imgRect = uploadedImg.getBoundingClientRect();

          const selection = (qualitySelect && qualitySelect.value) || 'original';
          let targetWidth;
          if (selection === 'original') {
            targetWidth = Math.max(
              uploadedImg.naturalWidth || imgRect.width,
              uploadedImg.naturalHeight || imgRect.height,
            );
          } else {
            targetWidth = parseInt(selection, 10) || Math.max(imgRect.width, imgRect.height);
          }

          const multiplier = targetWidth / cropRect.width;
          canvas.width = targetWidth;
          canvas.height = targetWidth;

          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.width / 2, canvas.width / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          const x = (imgRect.left - cropRect.left) * multiplier;
          const y = (imgRect.top - cropRect.top) * multiplier;

          const naturalRatio = (uploadedImg.naturalWidth || 1) / (uploadedImg.naturalHeight || 1);
          const visibleRatio = imgRect.width / imgRect.height;

          let renderW, renderH;
          if (naturalRatio > visibleRatio) {
            renderW = imgRect.width * multiplier;
            renderH = (imgRect.width / naturalRatio) * multiplier;
          } else {
            renderH = imgRect.height * multiplier;
            renderW = imgRect.height * naturalRatio * multiplier;
          }

          const finalX = x + (imgRect.width * multiplier - renderW) / 2;
          const finalY = y + (imgRect.height * multiplier - renderH) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(uploadedImg, finalX, finalY, renderW, renderH);
          ctx.restore();

          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png', 1.0);
          link.download = `circle-crop-${selection}.png`;
          link.click();
        } catch (err) {
          console.error('Export failed:', err);
          alert('The image is too large for your browser to process at this quality.');
        } finally {
          downloadBtn.classList.remove('is-processing');
          downloadBtn.innerHTML = originalContent;
        }
      }, 100);
    });
  }
});
