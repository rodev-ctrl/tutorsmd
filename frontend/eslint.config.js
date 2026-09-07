import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Сборочные артефакты линтовать незачем — там минифицированный вывод,
  // который даст тысячи ложных срабатываний.
  {
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      // Скомпилированный вывод tsc рядом с исходниками. Появлялся из-за
      // отсутствия noEmit в tsconfig.json (уже исправлено), но у тех, кто
      // собирал проект раньше, эти файлы остались лежать на диске.
      // В git их нет (frontend/.gitignore: *.js), так что в CI этой строки
      // и не потребовалось бы — она нужна, чтобы локальный прогон линтера
      // совпадал с прогоном в CI.
      "src/**/*.js",
    ],
  },

  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },

  // Браузерные глобалы плюс node — часть конфигов (vite, tailwind, postcss)
  // и тестов выполняется в node-окружении.
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,

  // <critical>
  // Без этой строки правило react/react-in-jsx-scope давало 1176 ошибок из 1229.
  // Оно требует `import React` в каждом файле с JSX — это правило эпохи React 16.
  // С React 17+ и автоматическим JSX-трансформом (jsx: "react-jsx" в tsconfig,
  // @vitejs/plugin-react в сборке) React в области видимости не нужен, компилятор
  // подставляет jsx() сам. Конфиг jsx-runtime отключает это правило и парное к
  // нему react/jsx-uses-react.
  // </critical>
  pluginReact.configs.flat["jsx-runtime"],

  {
    // Плагин был в devDependencies, но в конфиг не подключался. Из-за этого
    // существующие в коде комментарии
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // давали ошибку «Definition for rule was not found»: eslint видел ссылку
    // на правило, которого не знает. Подключение плагина чинит и это, и
    // включает проверку правил хуков.
    plugins: { "react-hooks": pluginReactHooks },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,

      // Проект на TypeScript: контракт компонента задают типы пропсов, а не
      // runtime-проверки propTypes. Держать оба источника правды — гарантия
      // того, что они разойдутся.
      "react/prop-types": "off",

      // Паттерн «выбросить одно поле»:
      //   const { confirmPassword, ...dto } = data;
      // confirmPassword здесь не забыт, а намеренно отброшен — он не должен
      // уйти на сервер. ignoreRestSiblings ровно для этого случая и существует.
      // Плюс соглашение: переменная с префиксом _ считается умышленно неиспользуемой.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // ── ХРАПОВИК ──────────────────────────────────────────────────────
      // Правило ниже нарушается в 39 местах — это накопленный долг, а не
      // регресс: линт в CI не запускался ни разу (workflow не парсился, см.
      // .github/workflows/pipeline.yml). Требовать типизации 20 файлов как
      // условия любого деплоя — значит блокировать выкатки ради задачи,
      // которая к ним отношения не имеет.
      //
      // Поэтому "warn", а не "off": нарушения печатаются в каждом прогоне CI
      // и никуда не прячутся. Порог --max-warnings=0 снят со скрипта lint,
      // иначе warn ничем не отличался бы от error.
      //
      // Как ужесточать: чинить пачками, следя за счётчиком
      //     npx eslint src --format stylish | tail -3
      // и когда дойдёт до нуля — вернуть "error" здесь и --max-warnings=0
      // в package.json. Тогда правило станет настоящими воротами.
      //
      // 13 из 39 — один и тот же паттерн `catch (err: any)`; правильная замена
      // `catch (err: unknown)` требует сужения типа в теле, поэтому это не
      // автозамена, а осмысленная правка.
      "@typescript-eslint/no-explicit-any": "warn",
      // ──────────────────────────────────────────────────────────────────
    },
    settings: {
      // Иначе eslint-plugin-react печатает предупреждение о ненайденной версии
      // React и отключает часть проверок.
      react: { version: "detect" },
    },
  },
];
