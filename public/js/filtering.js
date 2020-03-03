
const handleFormSubmit = (event) => {
    const formSelectFields = document.querySelectorAll('.js-filter-select');

    formSelectFields.forEach(function(item){
        if(item.value === "empty"){
            item.setAttribute("disabled", false)
            sessionStorage.setItem(`${item.name}`, `${item.value}`);
        }else{
            sessionStorage.setItem(`${item.name}`, `${item.value}`);
        }
    })
}

const handleCloseFilters = (event) => {
    const filterWindow = document.querySelector('.js-filter-window');

    filterWindow.classList.remove('filtering__container--mobile');
}

const checkButtonClass = (event) => {
    const pointer = event.target;
    if (typeof pointer.className !== 'string') {
      return;
    }
    if (pointer.className.match(/js-more-filters/)) {
        handleOpenFilters(event);
      }
    if (pointer.className.match(/js-filter-button/)) {
      handleFormSubmit(event);
    }
    if (pointer.className.match(/js-close-more-filters/)) {
        handleCloseFilters(event);
      }

}

const handleOpenFilters = (event) => {
    const filterWindow = document.querySelector('.js-filter-window');

    filterWindow.classList.add('filtering__container--mobile');
}

const removeUnusedModels = () => {
    const modelSelector = document.querySelector('#model');
    modelSelector.value = 'empty';
}

const handleModelOptions = (event) => {

    const makeSelect = document.querySelector('.js-make-select');
    const modelSelect = document.querySelector('.js-model-select');
    const makeOptions = document.querySelectorAll(".make-option");
    const modelOptions = document.querySelectorAll(".model-option");





    if( makeSelect.value !== 'empty'){

        while(modelSelect.options.length > 1){
            modelSelect.remove(1);
        }

        let item = localStorage.getItem(`${makeSelect.value}-make`);
        let itemArr = JSON.parse(item);

        itemArr.forEach(function(item){
            let op = document.createElement('option');
            op.value=item;
            op.innerHTML=item;
            modelSelect.appendChild(op);
        })

        if(sessionStorage.getItem('model') !== null){
            modelSelect.value = sessionStorage.getItem('model')
        }
    }if(makeSelect.value === 'empty'){
        while(modelSelect.options.length > 1){
            modelSelect.remove(1);
        }
    }
}

const checkSelect = () => {
    const pointer = event.target;
    if (typeof pointer.className !== 'string') {
        return;
      }
      if (pointer.className.match(/js-make-select/)) {
          handleModelOptions(event);
        }
        if (pointer.className.match(/js-make-select/)) {
            removeUnusedModels(event);
          }
}



const storeFilters = () => {
    const makeOptions = document.querySelectorAll(".make-option");
    const modelOptions = document.querySelectorAll(".model-option");


    makeOptions.forEach(function(makeOption){
        let modelArr = []
        if(makeOption.value === 'empty'){
            return;
        }
        modelOptions.forEach(function(modelOption){
            if(modelOption.value === 'empty'){
                return;
            }
            if(modelOption.id === makeOption.value){
                modelArr.push(modelOption.value)
            }
        })
        modelArr.sort();
        localStorage.setItem(`${makeOption.value}-make`, JSON.stringify(modelArr))
    })

}

const filterListener = () => {
    const formSelectFields = document.querySelectorAll('.js-filter-select');
    formSelectFields.forEach(function(item) {
        if(sessionStorage.getItem(`${item.name}`) !== null){
            item.value=sessionStorage.getItem(`${item.name}`);
        }
    })
    storeFilters();
    handleModelOptions();
    if(document.addEventListener) {
        document.addEventListener('click', checkButtonClass);
    }
    if(document.addEventListener) {
        document.addEventListener('input', checkSelect);
    }
}

filterListener();