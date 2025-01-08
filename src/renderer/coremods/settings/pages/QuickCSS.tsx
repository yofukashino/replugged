import { css } from "@codemirror/lang-css";
import { EditorState } from "@codemirror/state";

import { React, i18n, toast } from "@common";

import { Button, Divider, Flex, Text } from "@components";
import { webpack } from "@replugged";
import { EditorView, basicSetup } from "codemirror";
import { t } from "src/renderer/modules/i18n";
import { githubDark, githubLight } from "./codemirror-github";
import { generalSettings } from "./General";

import "./QuickCSS.css";

const { intl } = i18n;

interface UseCodeMirrorOptions {
  value?: string;
  onChange?: (code: string) => unknown;
  container?: HTMLDivElement | null;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type ThemeModule = {
  theme: "light" | "dark";
  addChangeListener: (listener: () => unknown) => unknown;
  removeChangeListener: (listener: () => unknown) => unknown;
};

const PopoutModule = await webpack.waitForModule(
  webpack.filters.bySource('type:"POPOUT_WINDOW_OPEN"'),
);
const openPopout = webpack.getFunctionBySource<
  (key: string, render: React.ComponentType, features: Record<string, string>) => void
>(PopoutModule, "POPOUT_WINDOW_OPEN")!;
const closePopout = webpack.getFunctionBySource<(key: string) => void>(
  PopoutModule,
  "POPOUT_WINDOW_CLOSE",
)!;

const setAlwaysOnTop = webpack.getFunctionBySource<(key: string, alwaysOnTop: boolean) => void>(
  PopoutModule,
  "POPOUT_WINDOW_SET_ALWAYS_ON_TOP",
)!;

const PopoutWindowStore = webpack.getByStoreName<
  Store & {
    getWindow: (key: string) => Window;
    getWindowOpen: (key: string) => boolean;
    getIsAlwaysOnTop: (key: string) => boolean;
  }
>("PopoutWindowStore")!;

function useTheme(): "light" | "dark" {
  const [theme, setTheme] = React.useState<"light" | "dark">("dark");

  const themeMod = webpack.getByProps<ThemeModule>(
    "theme",
    "addChangeListener",
    "removeChangeListener",
  );

  if (!themeMod) return theme;

  const themeChange = (): void => {
    setTheme(themeMod.theme);
  };

  React.useEffect(() => {
    themeChange();
    themeMod.addChangeListener(themeChange);

    return () => {
      themeMod.removeChangeListener(themeChange);
    };
  }, []);

  return theme;
}

function useCodeMirror({ value: initialValueParam, onChange, container }: UseCodeMirrorOptions): {
  value: string;
  setValue: (value: string) => void;
} {
  const theme = useTheme();

  const [value, setValue] = React.useState("");
  const [view, setView] = React.useState<EditorView | undefined>(undefined);

  const [update, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (initialValueParam) {
      setValue(initialValueParam);
      forceUpdate();
    }
  }, [initialValueParam]);

  React.useEffect(() => {
    if (!container) return undefined;
    if (view) view.destroy();

    const newView = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          css(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setValue(update.state.doc.toString());
              onChange?.(update.state.doc.toString());
            }
          }),
          theme === "light" ? githubLight : githubDark,
        ],
      }),
      parent: container,
    });
    setView(newView);

    container.setAttribute("data-theme", theme);

    return () => {
      newView.destroy();
      setView(undefined);
    };
  }, [container, theme, update]);

  const customSetValue = React.useCallback(
    (value: string) => {
      setValue(value);
      forceUpdate();
    },
    [view],
  );

  return { value, setValue: customSetValue };
}

const QuickCSS = (props: { popout: boolean } & Record<string, boolean>): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { value, setValue } = useCodeMirror({
    container: ref.current,
  });
  const idk = React.useRef();
  const [ready, setReady] = React.useState(false);

  const autoApply = generalSettings.get("autoApplyQuickCss");

  const reload = (): void => window.replugged.quickCSS.reload();
  const reloadAndToast = (): void => {
    reload();
    toast.toast(intl.string(t.REPLUGGED_TOAST_QUICKCSS_RELOAD));
  };

  React.useEffect(() => {
    void window.RepluggedNative.quickCSS.get().then((val) => {
      setValue(val);
      setReady(true);
    });

    // Save on CTRL + S / CMD + S
    const listener = (e: KeyboardEvent): void => {
      // XOR gate for CTRL / CMD (one of them must be pressed but not both)
      if (e.key === "s" && e.ctrlKey !== e.metaKey) {
        e.preventDefault();
        reloadAndToast();
      }
    };

    window.addEventListener("keydown", listener);

    // This is the best way I could come up with to not show the sticker picker when CTRL + S is pressed
    // We want it to only be active when this tab is active
    const hideStickerPickerCss = `
    [class*="positionLayer-"] {
      display: none;
    }
    `;
    const style = document.createElement("style");
    style.innerText = hideStickerPickerCss;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("keydown", listener);
      document.head.removeChild(style);
    };
  }, []);

  const [reloadTimer, setReloadTimer] = React.useState<NodeJS.Timeout | undefined>(undefined);

  React.useEffect(() => {
    if (!ready) return;
    window.RepluggedNative.quickCSS.save(value);

    // Debounce the auto reloading
    if (reloadTimer) clearTimeout(reloadTimer);
    if (autoApply) setReloadTimer(setTimeout(reload, 500));
  }, [value]);

  if (props.popout) {
    React.useEffect(() => {
      const window = PopoutWindowStore.getWindow("DISCORD_REPLUGGED_QUICKCSS");

      let el = window.document.createElement("link");
      el.rel = "stylesheet";
      el.href = `replugged://renderer.css?t=${Date.now()}`;
      window.document.head.appendChild(el);
    }, []);
  }

  const [alwaysOnTop, setAlwaysOnTop_] = React.useState(props.popoutOnTop);

  return (
    <>
      <Flex justify={Flex.Justify.BETWEEN} align={Flex.Align.START}>
        <Text.H2>{intl.string(t.REPLUGGED_QUICKCSS)}</Text.H2>
        <div style={{ display: "flex" }}>
          {autoApply ? null : (
            <Button onClick={reloadAndToast}>
              {intl.string(t.REPLUGGED_QUICKCSS_CHANGES_APPLY)}
            </Button>
          )}
          <Button
            onClick={() => window.RepluggedNative.quickCSS.openFolder()}
            color={Button.Colors.PRIMARY}
            look={Button.Looks.LINK}>
            {intl.string(t.REPLUGGED_QUICKCSS_FOLDER_OPEN)}
          </Button>
        </div>
      </Flex>
      <Divider style={{ margin: "20px 0px" }} />
      <div ref={ref} id="replugged-quickcss-wrapper" />
    </>
  );
};

export const ConnectedQuickCSS = flux.connectStores<
  { popout: boolean },
  { popout: boolean; isPopoutOpen: boolean }
>([PopoutWindowStore], (props) => {
  return {
    isPopoutOpen: PopoutWindowStore.getWindowOpen("DISCORD_REPLUGGED_QUICKCSS"),
    popoutOnTop: PopoutWindowStore.getIsAlwaysOnTop("DISCORD_REPLUGGED_QUICKCSS"),
    ...props,
  };
})(QuickCSS);
