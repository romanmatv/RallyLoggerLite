import { Toast } from "bootstrap";
import "../images/appIcon/icon.png"
export class teoToast{
    defOptions = {
        //file:///Y:/git-work/RallyLoggerLite/out/RallyLoggerLite-win32-x64/resources/app.asar/.webpack/renderer/main_window/compiled/images/src/images/appIcon/icon.png
        //file:///Y:/git-work/RallyLoggerLite/out/RallyLoggerLite-win32-x64/resources/app.asar/.webpack/renderer/compiled/images/node_modules/leaflet/dist/images/layers-2x.png
        icon: `../compiled/images/src/images/appIcon/icon.png`,
        title: "Rally Logger Lite",
        titleSmall: "",
        delay: 5000,
    };

    constructor(){
        this.toastContainer = document.querySelector("#toastContainer");
    }

    /**
     * 
     * @param {String} body_text 
     * @param {this.defOptions} options 
     */
    append(body_text, options = this.defOptions){
        //Проверяем опции
        if (typeof(options) != 'object') options = this.defOptions;
        if (options.icon == undefined) options.icon = this.defOptions.icon;
        if (options.title == undefined) options.title = this.defOptions.title;
        if (options.titleSmall == undefined) options.titleSmall = this.defOptions.titleSmall;
        if (options.delay == undefined) options.delay = this.defOptions.delay;

        let toast_id = new Date().getMilliseconds();

        let html = `
        <div class="toast" data-bs-autohide="true" id="toast_${toast_id}" >
            <div class="toast-header">
                <img src="${options.icon}" width="16" class="rounded me-2" alt="${this.defOptions.title}">
                <strong class="me-auto">${options.title}</strong>
                <small class="text-secondary toast-header-small">${options.titleSmall}</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Закрыть"></button>
            </div>
            <div class="toast-body">
                ${body_text}
            </div>
        </div>`;

        this.toastContainer.innerHTML += html;

        let t = document.getElementById(`toast_${toast_id}`);
        let toast = Toast.getOrCreateInstance(t, {delay: options.delay})
        t.addEventListener('hidden.bs.toast', e=>{
            t = document.getElementById(`toast_${toast_id}`);
            if (t) t.remove();
        })
        toast.show();
    }
}

export default teoToast;