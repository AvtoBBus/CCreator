import { ComponentInfoType } from "./types";

export function upperFirstLetter(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
};

export function getHistoryString(infoAboutComponent: ComponentInfoType): string {
    const resultBase = `${infoAboutComponent.framework} (`
    if (infoAboutComponent.framework === 'react') { return `${resultBase}${infoAboutComponent.componentType} + ${infoAboutComponent.script})`; };
    if (infoAboutComponent.framework === 'angular') { return `${infoAboutComponent.framework}`; };

    return `${resultBase}${infoAboutComponent.script} + ${infoAboutComponent.style})`;
}