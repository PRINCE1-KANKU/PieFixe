(function () {
  const indexGrid = document.querySelector('.article-index');
  const articlesSection = document.querySelector('.articles');
  if (!indexGrid || !articlesSection || !window.PIE_FIXE_API) return;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function renderCard(post) {
    return `
      <a class="page-card blog-card" href="#${post.slug}">
        <span class="blog-card__meta"><span>${escapeHtml(post.type)} / ${escapeHtml(post.readingTime)}</span><span>00</span></span>
        <span>
          <h2>${escapeHtml(post.title)}</h2>
          <span class="blog-card__summary">${escapeHtml(post.summary)}</span>
          <span class="blog-card__link">Read more ↘</span>
        </span>
      </a>`;
  }

  function renderArticle(post) {
    const apiRoot = window.PIE_FIXE_API.replace(/\/api\/?$/, '');
    const imageSrc = post.imageUrl
      ? (/^https?:\/\//.test(post.imageUrl) ? post.imageUrl : `${apiRoot}${post.imageUrl}`)
      : null;
    const image = imageSrc
      ? `<img src="${imageSrc}" alt="" style="max-width:100%;margin:22px 0;border:1px solid var(--line);" />`
      : '';
    const whatsappText = encodeURIComponent(`Hi Pie Fixe, I have a question about: ${post.title}`);
    return `
      <article class="article" id="${post.slug}">
        <p class="page-kicker">00 / ${escapeHtml(post.topic)}</p>
        <h2>${escapeHtml(post.title)}</h2>
        ${image}
        <p>${escapeHtml(post.body)}</p>
        <a class="text-link" href="https://wa.me/27688844462?text=${whatsappText}" target="_blank" rel="noopener">Ask Pie Fixe about this <span>↗</span></a>
      </article>`;
  }

  function renumber() {
    document.querySelectorAll('.blog-card__meta > span:last-child').forEach((el, index) => {
      el.textContent = String(index + 1).padStart(2, '0');
    });
    document.querySelectorAll('.articles > .article > .page-kicker').forEach((el, index) => {
      const label = String(index + 1).padStart(2, '0');
      el.textContent = el.textContent.replace(/^\d+/, label);
    });
  }

  fetch(`${window.PIE_FIXE_API}/posts`)
    .then((response) => (response.ok ? response.json() : []))
    .then((posts) => {
      if (!Array.isArray(posts) || posts.length === 0) return;
      indexGrid.insertAdjacentHTML('afterbegin', posts.map(renderCard).join(''));
      articlesSection.insertAdjacentHTML('afterbegin', posts.map(renderArticle).join(''));
      renumber();
    })
    .catch(() => {
      // Network or server unavailable — the static articles already on the page still work fine.
    });
})();
