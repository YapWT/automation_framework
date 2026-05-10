import { ref, onMounted } from 'vue';

const isDark = ref(false);

export function useTheme() {
    const toggleTheme = () => {
        isDark.value = !isDark.value;
        if (isDark.value) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    onMounted(() => {
        const saved = localStorage.getItem('theme');
        isDark.value = saved === 'dark';
        if (isDark.value) document.documentElement.classList.add('dark');
    });

    return { isDark, toggleTheme };
}
