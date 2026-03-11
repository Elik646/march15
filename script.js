const slices = [...document.querySelectorAll('.slice')];
const resetBtn = document.getElementById('resetBtn');

window.addEventListener('pointermove', (event) => {
  document.body.style.setProperty('--mx', `${event.clientX}px`);
  document.body.style.setProperty('--my', `${event.clientY}px`);
});

slices.forEach((slice) => {
  slice.addEventListener('click', () => {
    if (slice.classList.contains('cut')) return;
    slice.classList.add('cut');
  });
});

resetBtn.addEventListener('click', () => {
  slices.forEach((slice) => slice.classList.remove('cut'));
});
