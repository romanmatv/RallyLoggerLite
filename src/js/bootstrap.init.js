import rGlobal from "./rglobal";
import * as bootstrap from "bootstrap";

/**@type {Array<HTMLDivElement>} */
var tooltipTriggerList = Array.prototype.slice.call(
    document.querySelectorAll('[data-bs-toggle-second="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});

tooltipTriggerList.push(
    ...Array.prototype.slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    )
);
tooltipList.push(
    ...tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    })
);

/**@type {Array<HTMLDivElement>} */
var offcanvasElementList = Array.prototype.slice.call(
    document.querySelectorAll(".offcanvas")
);
/**@type {Array<bootstrap.Offcanvas>} */
var offcanvasList = offcanvasElementList.map(function (offcanvasEl) {
    offcanvasEl.addEventListener("hidden.bs.offcanvas", (e) => {
        setTimeout(() => {
            for (const tool of tooltipList) {
                tool.hide();
            }
        }, 30);
    });
    return new bootstrap.Offcanvas(offcanvasEl);
});
var buttonElementList = Array.prototype.slice.call(
    document.querySelectorAll('[data-bs-toggle="offcanvas"]')
);
var buttonList = buttonElementList.map(function (button) {
    if (button) {
        button.addEventListener("click", (e) => {
            button.blur();
        });
        return button;
    }
});

let buttons = document.querySelectorAll("button");
buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        btn.blur();
        let tooltip = bootstrap.Tooltip.getInstance(btn);
        //console.log("tooltip", tooltip);
        if (tooltip) {
            tooltip.hide();
        }
    });
});
