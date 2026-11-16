const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', 'node_modules', 'react-native-css-interop', 'dist', 'runtime');

// 1. Patch wrap-jsx.js
const wrapJsxPath = path.join(baseDir, 'wrap-jsx.js');
if (fs.existsSync(wrapJsxPath)) {
    let content = fs.readFileSync(wrapJsxPath, 'utf8');
    if (!content.includes('typeof fn !== "function"')) {
        content = content.replace(
            /return jsx\.call\(jsx, type, props, \.\.\.rest\);/,
            `let fn = jsx;
        if (typeof fn !== "function") {
            try {
                const rt = require("react/jsx-runtime");
                fn = rt.jsx || rt.jsxs;
            } catch {}
            if (typeof fn !== "function") {
                try {
                    const devRt = require("react/jsx-dev-runtime");
                    fn = devRt.jsxDEV;
                } catch {}
            }
        }
        if (typeof fn !== "function") {
            const React = require("react");
            return React.createElement(type, props, ...(props && props.children ? (Array.isArray(props.children) ? props.children : [props.children]) : []));
        }
        return fn.call(fn, type, props, ...rest);`
        );
        fs.writeFileSync(wrapJsxPath, content, 'utf8');
        console.log('[patch-css-interop] Patched wrap-jsx.js for React 19 compatibility.');
    }
}

// 2. Patch jsx-dev-runtime.js
const jsxDevPath = path.join(baseDir, 'jsx-dev-runtime.js');
if (fs.existsSync(jsxDevPath)) {
    let content = fs.readFileSync(jsxDevPath, 'utf8');
    if (!content.includes('react_jsx_runtime_1')) {
        content = content.replace(
            /exports\.jsxs = \(0, wrap_jsx_1\.default\)\(jsx_dev_runtime_1\.default\.jsxs\);\s*exports\.jsx = \(0, wrap_jsx_1\.default\)\(jsx_dev_runtime_1\.default\.jsx\);/,
            `const react_jsx_runtime_1 = require("react/jsx-runtime");
exports.jsxs = (0, wrap_jsx_1.default)(jsx_dev_runtime_1.default.jsxs || react_jsx_runtime_1.jsxs || jsx_dev_runtime_1.default.jsxDEV);
exports.jsx = (0, wrap_jsx_1.default)(jsx_dev_runtime_1.default.jsx || react_jsx_runtime_1.jsx || jsx_dev_runtime_1.default.jsxDEV);`
        );
        fs.writeFileSync(jsxDevPath, content, 'utf8');
        console.log('[patch-css-interop] Patched jsx-dev-runtime.js for React 19 compatibility.');
    }
}

// 3. Patch jsx-runtime.js
const jsxRuntimePath = path.join(baseDir, 'jsx-runtime.js');
if (fs.existsSync(jsxRuntimePath)) {
    let content = fs.readFileSync(jsxRuntimePath, 'utf8');
    if (!content.includes('react_jsx_dev_1')) {
        content = content.replace(
            /exports\.jsxDEV = \(0, wrap_jsx_1\.default\)\(jsx_runtime_1\.default\.jsxDEV\);/,
            `const react_jsx_dev_1 = require("react/jsx-dev-runtime");
exports.jsxDEV = (0, wrap_jsx_1.default)(jsx_runtime_1.default.jsxDEV || react_jsx_dev_1.jsxDEV || jsx_runtime_1.default.jsx);`
        );
        fs.writeFileSync(jsxRuntimePath, content, 'utf8');
        console.log('[patch-css-interop] Patched jsx-runtime.js for React 19 compatibility.');
    }
}

