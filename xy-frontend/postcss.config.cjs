// The pinned 2023 UniApp/Vite toolchain does not automatically register its
// H5 rpx transformer with newer PostCSS releases. Register it explicitly so
// browser builds never ship unsupported `rpx` declarations.
const uniApp = require('@dcloudio/uni-cli-shared/dist/postcss/plugins/uniapp').default

module.exports = {
  plugins: [uniApp()],
}
