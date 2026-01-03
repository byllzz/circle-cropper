const langData = {
  english: {
    'meta-title': 'CircleCropper — Instant Circle Cropper',
    'app-desc-top': 'meet circlecropper',
    'upload-img-btn': 'Upload Image',
    'download-btn-text': 'Crop & Download',
    'quality-best': 'Original Size',
    'quality-4k': '4K Ultra HD',
    'quality-1080': '1080p Full HD',
    'main-h1': 'Crop images into perfect circles. Instantly.',
    'main-article': 'Free online circle image cropper. No signup. Works on all devices.',
    processing: 'Processing 4K image...',
  },

  urdu: {
    'meta-title': 'CircleCropper — فوری دائرہ وار کراپ کریں',
    'app-desc-top': 'CircleCropper سے ملو',
    'upload-img-btn': 'تصویر اپ لوڈ کریں',
    'download-btn-text': 'کراپ کریں اور ڈاؤن لوڈ کریں',
    'quality-best': 'اصل سائز',
    'quality-4k': '4K الٹرا ایچ ڈی',
    'quality-1080': '1080p فل ایچ ڈی',
    'main-h1': 'تصاویر کو کامل دائرے میں کراپ کریں — فوری طور پر۔',
    'main-article':
      'مفت آن لائن سرکل امیج کراپر۔ سائن اپ کی ضرورت نہیں۔ تمام ڈیوائسز پر کام کرتا ہے۔',
    processing: '4K امیج پروسیسنگ جاری ہے...',
  },

  spanish: {
    'meta-title': 'CircleCropper — Recorta círculos perfectos al instante',
    'app-desc-top': 'Conoce CircleCropper',
    'upload-img-btn': 'Subir imagen',
    'download-btn-text': 'Recortar y descargar',
    'quality-best': 'Tamaño original',
    'quality-4k': '4K Ultra HD',
    'quality-1080': '1080p Full HD',
    'main-h1': 'Recorta imágenes en perfectos círculos — al instante.',
    'main-article':
      'Recortador circular gratuito en el navegador. Sin registro. Funciona en todos los dispositivos.',
    processing: 'Procesando imagen 4K...',
  },
};

const languageNames = {
  english: 'English',
  urdu: 'اردو',
  spanish: 'Español',
};

function detectPreferredLanguage() {
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  if (typeof nav !== 'string') return 'english';
  if (nav.startsWith('ur')) return 'urdu';
  if (nav.startsWith('es')) return 'spanish';
  return 'english';
}
function applyLanguage(langKey) {
  const dict = langData[langKey] || langData.english;

  // Title
  if (dict['meta-title']) {
    document.title = dict['meta-title'];
    const titleTag = document.querySelector('title[data-lang-key]');
    if (titleTag) titleTag.textContent = dict['meta-title'];
  }

  // meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && dict['app-desc-top']) {
    metaDesc.setAttribute('content', dict['app-desc-top']);
  }

  // generic
  document.querySelectorAll('[data-lang-key]').forEach(el => {
    const key = el.getAttribute('data-lang-key');
    if (key && dict[key]) el.textContent = dict[key];
  });

  // small direct
  const directMap = {
    'main-h1': '.hero-title',
    'main-article': '.hero-subtitle',
    'app-desc-top': '.app-title-greeting article',
  };
  Object.entries(directMap).forEach(([k, sel]) => {
    if (!dict[k]) return;
    const node = document.querySelector(sel);
    if (node) node.textContent = dict[k];
  });

  // Export
  const exportSelect = document.getElementById('export-quality');
  if (exportSelect) {
    const valueToKey = {
      original: 'quality-best',
      3840: 'quality-4k',
      1080: 'quality-1080',
    };

    Object.entries(valueToKey).forEach(([val, key]) => {
      const opt = exportSelect.querySelector(`option[value="${val}"]`);
      if (opt && dict[key]) opt.textContent = dict[key];
    });
  }
}

function initLanguageSwitcher() {
  const select = document.getElementById('lang-select');
  if (!select) return;

  select.innerHTML = '';
  Object.keys(langData).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = languageNames[key] || key;
    select.appendChild(opt);
  });

  // Load saved or detect
  let saved = null;
  try {
    saved = localStorage.getItem('site-lang');
  } catch (err) {
    /* ignore storage errors */
  }
  const initial = saved && langData[saved] ? saved : detectPreferredLanguage();

  select.value = initial in langData ? initial : Object.keys(langData)[0];
  applyLanguage(select.value);

  // Persist changes
  select.addEventListener('change', e => {
    const chosen = e.target.value;
    if (chosen && langData[chosen]) {
      applyLanguage(chosen);
      try {
        localStorage.setItem('site-lang', chosen);
      } catch (err) {
        /* ignore */
      }
    }
  });
}

/* Boot: run when DOM is ready */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initLanguageSwitcher();
  } catch (err) {
    console.error('Language init error:', err);
  }
});
