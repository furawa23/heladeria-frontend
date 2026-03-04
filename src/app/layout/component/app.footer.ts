import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        Creado por
        <a href="https://github.com/furawa23" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Fabrizzio Flores</a>
    </div>`
})
export class AppFooter {}
