import { ref } from 'vue';

// export interface WorkflowConfig {
//     excelPath: string;
//     useExcel: boolean;
//     headless: boolean;
// }

// export interface Step {
//     id: number;
//     action: string;
//     params: any;
// }

export interface Task {
    id: string;
    label: string;
    status: 'running' | 'success' | 'error';
}

export const workflow = ref({
    name: "automation_task",
    config: { excelPath: "", useExcel: false, headless: false },
    steps: [] as any[]
});

export const STRATEGIES_BY_ACTION: Record<string, any[]> = {
    fill: [
        { id: "textbox", label: "Text Box / Input" },
        { id: "placeholder", label: "By Hint" },
        { id: "label", label: "By Label" },
        { id: "css", label: "Advanced CSS" },
    ],
    click: [
        { id: "button", label: "Button" },
        { id: "link", label: "Link" },
        { id: "checkbox", label: "Checkbox" },
        { id: "radio", label: "Radio Button" },
        { id: "text", label: "Visible Text" },
        { id: "css", label: "Advanced CSS" },
    ],
    upload: [
        { id: "label", label: "Label next to Upload" },
        { id: "textbox", label: "Input Box" },
    ],
    download: [
        { id: "button", label: "Download Button" },
        { id: "link", label: "Download Link" },
    ],
    wait_for: [
        { id: "text", label: "Visible Text" },
        { id: "textbox", label: "Text Box" },
        { id: "button", label: "Button" },
    ],
};

