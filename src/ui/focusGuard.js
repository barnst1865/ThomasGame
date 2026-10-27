// A game in a web page only hears the keyboard while the page has focus.
// When it doesn't (for example after clicking somewhere else on the screen),
// the game pauses and shows a big button to click to keep playing.

const BUTTON_STYLE = {
  position: 'fixed',
  inset: '0',
  display: 'none',
  placeItems: 'center',
  border: '0',
  margin: '0',
  padding: '0',
  background: 'rgba(29, 42, 31, 0.55)',
  cursor: 'pointer',
  font: 'inherit',
  zIndex: '10',
};

const LABEL_STYLE = {
  background: '#f6ecd2',
  color: '#2b2024',
  border: '3px solid #5e3a26',
  borderRadius: '10px',
  padding: '14px 28px',
  fontFamily: '"Pixelify Sans", ui-monospace, monospace',
  fontSize: '22px',
  fontWeight: '700',
  boxShadow: '0 4px 0 #5e3a26',
};

export function installFocusGuard(game) {
  const button = document.createElement('button');
  button.type = 'button';
  const label = document.createElement('span');
  Object.assign(button.style, BUTTON_STYLE);
  Object.assign(label.style, LABEL_STYLE);
  button.append(label);
  document.body.append(button);
  let showing = false;

  const show = (text) => {
    label.textContent = text;
    button.style.display = 'grid';
    showing = true;
    game.pause();
  };
  const hide = () => {
    button.style.display = 'none';
    showing = false;
    game.resume();
  };

  button.addEventListener('click', () => {
    window.focus();
    hide();
  });
  window.addEventListener('blur', () => show('Paused. Click to keep playing'));
  window.addEventListener('focus', () => {
    if (showing) hide();
  });
  if (!document.hasFocus()) show('Click to play');
}
