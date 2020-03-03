const modal = document.querySelector('.js-modal');
const modalWrapper = document.querySelector('.js-modal-wrapper');
const modalContent = document.querySelector('.js-modal-content');

const modalBuilder = (event) => {
    const data = event.target.dataset.modal;
    document.querySelector(`.modal__${data}`).classList.add(`modal__${data}--visible`)
}

const modalCleaner = () => {
    document.querySelector('.modal__consent').classList.remove('modal__consent--visible');
    document.querySelector('.modal__privacy').classList.remove('modal__privacy--visible');
}

const handleModalVisible = (event) => {
    modalBuilder(event);
    modal.classList.add('modal--visible');
  };


const handleModalClick = (event) => {
  if (event.target === modalWrapper || event.target.className.match(/privacy__button/)) {
    modal.classList.remove('modal--visible');
    modalCleaner();
  }
};
  

const handleModalClosing = (event) => {
    const pointer = event.target;
    if (typeof pointer.className !== 'string') {
      return;
    }
    if (pointer.className.match(/js-modal-wrapper/) || pointer.className.match(/privacy__button/)) {
      handleModalClick(event);
    }
  };

const handleModalOpen = (event) => {
    const pointer = event.target;
    if (typeof pointer.className !== 'string') {
      return;
    }
    if (pointer.className.match(/js-modal-open/)) {
      handleModalVisible(event);
    }
  };


const modalListener = () => {
    if (document.addEventListener) {
      document.addEventListener('click', handleModalOpen);
      document.addEventListener('click', handleModalClosing);
    }
  };
  
modalListener();