/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./*.{html,js}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui']
            },
            colors: {
                brand: {
                    50: "#f4f0ff",
                    100: "#e8ddff",
                    200: "#cbb8ff",
                    300: "#b093ff",
                    400: "#967cf0",
                    500: "#3808e4",
                    600: "#2f07c1",
                    700: "#26069f",
                    800: "#1d047d",
                    900: "#14035b"
                }
            }
        }
    },
    plugins: [],
}
