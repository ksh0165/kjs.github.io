document.addEventListener("DOMContentLoaded", () => {
    const deviceImg = document.querySelectorAll(".service-device__img");

    deviceImg.forEach(($toggle) => {
        $toggle.onclick = () => {
            deviceImg.forEach(element => {
                element.classList.remove('active');
            });
            $toggle.classList.add('active');
            setTimeout(function() {
                window.location.href = "lang.html";
            }, 1000);
        }
    });

    const langSelect = document.querySelectorAll(".lang-list a");
    langSelect.forEach(($toggle) => {
        $toggle.onclick = () => {
            langSelect.forEach(element => {
                element.classList.remove('on');
            });
            $toggle.classList.add('on');
            setTimeout(function() {
                window.location.href = "voice01.html";
            }, 1000);
        }
    });

    const langTablet = document.querySelector(".service-device-tablet a");
    if(langTablet){
        langTablet.addEventListener("click", function() {
            setTimeout(function() {
            window.location.href = "lang.html";
            }, 1000);
        });
    }

    const langPhone = document.querySelector(".service-device-phone a");
    if(langPhone){
        langPhone.addEventListener("click", function() {
            setTimeout(function() {
            window.location.href = "qr.html";
            }, 1000);
        });
    }

});
