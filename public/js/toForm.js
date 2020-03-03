const pasiulymas = document.querySelector("#iForma");
const forma = document.querySelector("#forma");

pasiulymas.addEventListener('click', function(){
    handleScroll(forma);
})

function handleScroll(element) {
    window.scroll({
        behavior: 'smooth',
        left: 0,
        top: element.offsetTop,
      });
}

