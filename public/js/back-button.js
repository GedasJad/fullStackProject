const handleBack = (event) => {
    window.history.back();
}

const clickBackHandle = (event) => {
    const pointer = event.target;
    if (typeof pointer.className !== 'string') {
        return;
      }
      if (pointer.className.match(/js-back-button/)) {
        handleBack(event);
      }
}

const backListener = () => {
    if (document.addEventListener) {
        document.addEventListener('click', clickBackHandle);
    }
}

backListener();