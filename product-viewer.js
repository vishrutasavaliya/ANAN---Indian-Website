(() => {
    const gallery = document.querySelector('.collection-design-grid');
    if (!gallery) {
        return;
    }

    const tiles = [...gallery.querySelectorAll('.collection-design-tile')];
    if (!tiles.length) {
        return;
    }

    const products = tiles.map((tile) => {
        const params = new URL(tile.href).searchParams;
        return {
            image: params.get('image'),
            title: params.get('title'),
            collection: params.get('collection') || document.title.replace(/\s*\|\s*ANAN$/, ''),
            alt: tile.querySelector('img')?.alt || params.get('title')
        };
    });

    if (products.some((product) => !product.image || !product.title)) {
        throw new Error('A collection design is missing its image or title.');
    }

    const overlay = document.createElement('section');
    overlay.className = 'product-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Jewellery design viewer');
    overlay.hidden = true;
    overlay.innerHTML = `
        <img class="product-lightbox-backdrop" alt="" aria-hidden="true">
        <div class="product-lightbox-shade" aria-hidden="true"></div>
        <header class="product-lightbox-header">
            <h2 class="product-lightbox-title"></h2>
            <button class="product-lightbox-close" type="button" aria-label="Close design">×</button>
        </header>
        <button class="product-lightbox-nav product-lightbox-previous" type="button" aria-label="Previous design">‹</button>
        <div class="product-lightbox-stage">
            <img class="product-lightbox-image" alt="">
        </div>
        <button class="product-lightbox-nav product-lightbox-next" type="button" aria-label="Next design">›</button>
        <footer class="product-lightbox-footer">
            <span class="product-lightbox-count" aria-live="polite"></span>
            <div class="product-lightbox-zoom" aria-label="Image zoom controls">
                <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
                <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
            </div>
            <a class="product-lightbox-request" href="contact.html#contact-enquiry">Request Details</a>
        </footer>
    `;
    document.body.append(overlay);

    const image = overlay.querySelector('.product-lightbox-image');
    const backdrop = overlay.querySelector('.product-lightbox-backdrop');
    const title = overlay.querySelector('.product-lightbox-title');
    const count = overlay.querySelector('.product-lightbox-count');
    const previousButton = overlay.querySelector('.product-lightbox-previous');
    const nextButton = overlay.querySelector('.product-lightbox-next');
    const closeButton = overlay.querySelector('.product-lightbox-close');
    const stage = overlay.querySelector('.product-lightbox-stage');
    let activeIndex = 0;
    let zoom = 1;
    let previousFocus;
    let previousOverflow;
    let closeTimer;

    function renderProduct() {
        const product = products[activeIndex];
        zoom = 1;
        image.src = product.image;
        image.alt = product.alt;
        image.style.transform = 'translate(-50%, -50%) scale(1)';
        backdrop.src = product.image;
        title.textContent = product.collection;
        count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
        previousButton.disabled = activeIndex === 0;
        nextButton.disabled = activeIndex === products.length - 1;
    }

    function openViewer(index, trigger) {
        window.clearTimeout(closeTimer);
        activeIndex = index;
        previousFocus = trigger;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        renderProduct();
        overlay.hidden = false;
        requestAnimationFrame(() => {
            overlay.classList.add('is-open');
            closeButton.focus({ preventScroll: true });
        });
    }

    function closeViewer() {
        if (overlay.hidden) {
            return;
        }

        overlay.classList.remove('is-open');
        document.body.style.overflow = previousOverflow;
        closeTimer = window.setTimeout(() => {
            overlay.hidden = true;
            previousFocus?.focus({ preventScroll: true });
        }, 240);
    }

    function navigate(direction) {
        const nextIndex = activeIndex + direction;
        if (nextIndex < 0 || nextIndex >= products.length) {
            return;
        }

        activeIndex = nextIndex;
        renderProduct();
    }

    function updateZoom(nextZoom) {
        nextZoom = Math.min(4, Math.max(1, nextZoom));
        if (nextZoom === zoom) {
            return;
        }

        zoom = nextZoom;
        image.style.transform = `translate(-50%, -50%) scale(${zoom})`;
    }

    tiles.forEach((tile, index) => {
        tile.addEventListener('click', (event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            event.preventDefault();
            openViewer(index, tile);
        });
    });

    closeButton.addEventListener('click', closeViewer);
    previousButton.addEventListener('click', () => navigate(-1));
    nextButton.addEventListener('click', () => navigate(1));

    overlay.addEventListener('click', (event) => {
        if (
            event.target === overlay ||
            event.target.classList.contains('product-lightbox-shade') ||
            event.target.classList.contains('product-lightbox-backdrop')
        ) {
            closeViewer();
        }
    });

    overlay.querySelectorAll('[data-zoom]').forEach((button) => {
        button.addEventListener('click', () => {
            const direction = button.dataset.zoom === 'in' ? 1.2 : 1 / 1.2;
            updateZoom(zoom * direction);
        });
    });

    stage.addEventListener('wheel', (event) => {
        event.preventDefault();
        updateZoom(zoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15));
    }, { passive: false });

    document.addEventListener('keydown', (event) => {
        if (overlay.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            closeViewer();
        } else if (event.key === 'ArrowLeft') {
            navigate(-1);
        } else if (event.key === 'ArrowRight') {
            navigate(1);
        }
    });
})();
