(() => {
  const projects = {
    aweigh: { title: 'Aweigh', caption: 'Your next ferry, at a glance.', kind: 'watch', image: '../../assets/aweigh/watchos-poster.webp', alt: 'Aweigh ferry schedule on an Apple Watch' },
    pixellate: { title: 'Pixellate Camera', caption: 'Another way to see the same world.', kind: 'photo', image: '../../assets/portfolio/Pixellate.webp', alt: 'Pixellate Camera project image' },
    dream: { title: 'Printing the Dream', caption: 'A picture becomes controller inputs.', kind: 'console', image: '../../assets/portfolio/PrintingTheDream.webp', alt: 'A console drawing and the hardware used by Printing the Dream' }
  };
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    document.querySelectorAll('[data-project]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const img = document.getElementById('artifact-image');
    img.src = project.image; img.alt = project.alt;
    document.querySelector('.artifact').dataset.kind = project.kind;
    document.getElementById('artifact-title').textContent = project.title;
    document.getElementById('artifact-caption').textContent = project.caption;
    window.portfolioWater?.drop(.72, .53, .7);
  }));
  document.getElementById('light').addEventListener('click', event => {
    const night = document.body.classList.toggle('night');
    event.currentTarget.setAttribute('aria-pressed', String(night));
    event.currentTarget.innerHTML = night ? 'Daylight <span aria-hidden="true">◐</span>' : 'After hours <span aria-hidden="true">◐</span>';
    window.portfolioWater?.setNight(night);
  });
  document.getElementById('ripple').addEventListener('click', () => window.portfolioWater?.drop(.57, .52, 1));
})();
