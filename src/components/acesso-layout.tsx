import { useEffect, useRef, useState, type ReactNode } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import {
  Animated,
  Easing,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BrandSignature } from "../design/brand";
import { nativeDriver, useReducedMotion } from "../design/motion";
import { useTheme } from "./ui";

function VideoSolidariedade() {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === "active");
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const player = useVideoPlayer(
    require("../../assets/videos/solidariedade-sequencia.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.audioMixingMode = "mixWithOthers";
      p.keepScreenOnWhilePlaying = false;
      p.showNowPlayingNotification = false;
    },
  );
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  const failed = status === "error";
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    if (Platform.OS !== "web") return () => subscription.remove();
    const change = () => setVisible(!document.hidden);
    change();
    document.addEventListener("visibilitychange", change);
    return () => {
      subscription.remove();
      document.removeEventListener("visibilitychange", change);
    };
  }, []);
  useEffect(() => {
    if (focused && active && visible && !reduced && !failed) player.play();
    else player.pause();
    // useVideoPlayer libera o player ao desmontar; o foco controla telas mantidas na navegação.
  }, [focused, active, visible, reduced, failed, player]);
  return (
    <>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <Image
          source={require("../../assets/videos/solidariedade-capa.jpg")}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
        {status !== "error" ? (
          <VideoView
            player={player}
            nativeControls={false}
            playsInline
            contentFit="cover"
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            surfaceType="textureView"
            onFirstFrameRender={() => setReady(true)}
            style={[
              StyleSheet.absoluteFill,
              { width: "100%", height: "100%", opacity: ready ? 1 : 0 },
            ]}
          />
        ) : null}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="acesso-sombra" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#061C49" stopOpacity="0.22" />
              <Stop offset="0.45" stopColor="#061C49" stopOpacity="0.06" />
              <Stop offset="1" stopColor="#061C49" stopOpacity="0.82" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#acesso-sombra)" />
        </Svg>
      </View>
    </>
  );
}

export function AcessoLayout({
  cadastro = false,
  retorno,
  children,
}: {
  cadastro?: boolean;
  retorno?: string;
  children: ReactNode;
}) {
  const r = useRouter();
  const { colors, fontsReady } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 900;
  const fontTitle = fontsReady ? "Sora-SemiBold" : undefined;
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const formMotion = useRef(new Animated.Value(0)).current;
  const tabMotion = useRef(new Animated.Value(cadastro ? 1 : 0)).current;
  const [tabWidth, setTabWidth] = useState(0);
  const [switching, setSwitching] = useState(false);
  const [selectedTab, setSelectedTab] = useState(cadastro);
  useEffect(() => {
    if (!focused) return;
    setSwitching(false);
    formMotion.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(formMotion, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, formMotion]);
  useEffect(() => () => tabMotion.stopAnimation(), [tabMotion]);
  function trocarConta(register: boolean) {
    if (cadastro === register || switching) return;
    setSwitching(true);
    setSelectedTab(register);
    const navigate = () =>
      r.replace({
        pathname: register ? "/criar-conta" : "/entrar",
        params: { retorno },
      });
    if (reduced) {
      navigate();
      return;
    }
    Animated.parallel([
      Animated.timing(tabMotion, {
        toValue: register ? 1 : 0,
        duration: 240,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(formMotion, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: nativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished) navigate();
    });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View
          style={[
            styles.layout,
            { minHeight: height, flexDirection: wide ? "row" : "column" },
          ]}
        >
          <View
            style={[
              styles.hero,
              wide
                ? { width: width >= 1200 ? "55%" : "50%", minHeight: height }
                : {
                    width: "100%",
                    height: Math.max(
                      width < 360 ? 310 : 350,
                      Math.min(420, height * 0.48),
                    ),
                  },
            ]}
          >
            <VideoSolidariedade />
            <View
              pointerEvents="none"
              style={[
                styles.heroContent,
                {
                  padding: wide ? 48 : 24,
                  paddingTop: Math.max(insets.top + 20, wide ? 48 : 24),
                },
              ]}
            >
              <BrandSignature inverse animated size={wide ? 52 : 44} />
              <View
                style={{ gap: wide ? 20 : 10, paddingBottom: wide ? 28 : 24 }}
              >
                <Text
                  style={[
                    styles.heroTitle,
                    {
                      fontFamily: fontTitle,
                      fontSize: wide ? 44 : 28,
                      lineHeight: wide ? 56 : 36,
                    },
                  ]}
                >
                  {wide
                    ? "O cuidado começa com a gente."
                    : "Juntos, a gente soma."}
                </Text>
                {wide ? (
                  <Text style={styles.heroCopy}>
                    Um gesto seu pode fazer parte de uma história muito maior.
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          <View
            style={[
              styles.panel,
              {
                backgroundColor: colors.surface,
                padding: width < 360 ? 20 : wide ? 48 : 24,
                paddingBottom: Math.max(insets.bottom + 24, 32),
              },
              !wide && styles.mobilePanel,
            ]}
          >
            <View style={styles.form}>
              <Pressable
                accessibilityRole="link"
                onPress={() => r.replace("/")}
                style={styles.explore}
              >
                <Ionicons name="arrow-back" size={17} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  Explorar o SOMA
                </Text>
              </Pressable>
              <View
                onLayout={(event) =>
                  setTabWidth(
                    Math.max(0, (event.nativeEvent.layout.width - 10) / 2),
                  )
                }
                style={[
                  styles.tabs,
                  { backgroundColor: colors.bg, borderColor: colors.line },
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 4,
                    top: 4,
                    bottom: 4,
                    width: tabWidth,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    transform: [
                      {
                        translateX: tabMotion.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, tabWidth],
                        }),
                      },
                    ],
                  }}
                />
                {[false, true].map((register) => (
                  <Pressable
                    key={String(register)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: cadastro === register }}
                    disabled={switching}
                    onPress={() => trocarConta(register)}
                    style={styles.tab}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
                        color:
                          selectedTab === register
                            ? colors.onPrimary
                            : colors.muted,
                      }}
                    >
                      {register ? "Criar conta" : "Entrar"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Animated.View
                testID="access-form-motion"
                style={{
                  gap: 22,
                  opacity: formMotion,
                  transform: [
                    {
                      translateX: formMotion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [cadastro ? 20 : -20, 0],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.heading}>
                  <Text
                    accessibilityRole="header"
                    aria-level={1}
                    style={{
                      color: colors.ink,
                      fontFamily: fontTitle,
                      fontSize: wide ? 32 : 27,
                      lineHeight: wide ? 42 : 36,
                    }}
                  >
                    {cadastro
                      ? "Sua história também soma."
                      : "Bom ter você por aqui."}
                  </Text>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 16,
                      lineHeight: 25,
                    }}
                  >
                    {cadastro
                      ? "Crie sua conta para apoiar causas e aproximar quem quer ajudar."
                      : "Entre para acompanhar suas causas e continuar fazendo a diferença."}
                  </Text>
                </View>
                {children}
              </Animated.View>
              <View style={[styles.footer, { borderTopColor: colors.line }]}>
                <Ionicons
                  name="heart-outline"
                  color={colors.primary}
                  size={18}
                />
                <Text
                  style={{
                    flex: 1,
                    color: colors.muted,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  Doe, compartilhe ou ofereça seu tempo. Toda forma de ajudar
                  soma.
                </Text>
              </View>
              <View style={styles.legal}>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => r.push("/termos")}
                  style={styles.legalLink}
                >
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    Termos de uso
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => r.push("/privacidade")}
                  style={styles.legalLink}
                >
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    Privacidade
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function CampoAcesso({
  label,
  icon,
  password = false,
  ...props
}: TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  password?: boolean;
}) {
  const { colors, fontsReady } = useTheme();
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const reduced = useReducedMotion();
  const inputMotion = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(inputMotion, {
      toValue: focus ? 1 : 0,
      duration: reduced ? 0 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [focus, reduced, inputMotion]);
  return (
    <Animated.View
      style={{
        gap: 8,
        transform: [
          {
            translateY: inputMotion.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -2],
            }),
          },
        ],
      }}
    >
      <Text
        style={{
          color: focus ? colors.primary : colors.ink,
          fontSize: 14,
          fontFamily: fontsReady ? "Manrope-SemiBold" : undefined,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: focus ? colors.brandSoft : colors.bg,
            borderColor: focus ? colors.primary : colors.line,
            borderWidth: 2,
          },
        ]}
      >
        <Animated.View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: focus ? colors.primary : colors.surface,
            alignItems: "center",
            justifyContent: "center",
            transform: [
              {
                scale: inputMotion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          }}
        >
          <Ionicons
            name={icon}
            size={19}
            color={focus ? colors.onPrimary : colors.muted}
            accessible={false}
          />
        </Animated.View>
        <TextInput
          {...props}
          accessibilityLabel={label}
          secureTextEntry={password && !show}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          style={[
            styles.input,
            {
              color: colors.ink,
              fontFamily: fontsReady ? "Manrope-Regular" : undefined,
              ...(Platform.OS === "web" ? { outlineWidth: 0 } : {}),
            },
          ]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              show
                ? `Ocultar ${label.toLowerCase()}`
                : `Mostrar ${label.toLowerCase()}`
            }
            onPress={() => setShow(!show)}
            style={styles.eye}
          >
            <Ionicons
              name={show ? "eye-off-outline" : "eye-outline"}
              size={21}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1 },
  layout: { flex: 1 },
  hero: { backgroundColor: "#153A99", overflow: "hidden" },
  heroContent: { flex: 1, justifyContent: "space-between" },
  heroTitle: { color: "#FFFFFF", maxWidth: 490, letterSpacing: -1.2 },
  heroCopy: { color: "#E4EDFF", fontSize: 18, lineHeight: 29, maxWidth: 370 },
  panel: { flex: 1, justifyContent: "center" },
  mobilePanel: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  form: { width: "100%", maxWidth: 440, alignSelf: "center", gap: 22 },
  explore: {
    minHeight: 44,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  tabs: { flexDirection: "row", borderRadius: 16, padding: 4, borderWidth: 1 },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { gap: 10 },
  footer: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 22,
    alignItems: "flex-start",
  },
  legal: { flexDirection: "row", justifyContent: "center", gap: 20 },
  legalLink: { minHeight: 44, justifyContent: "center" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 10,
    minHeight: 62,
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingVertical: 14,
    paddingRight: 12,
    fontSize: 16,
  },
  eye: {
    width: 48,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
});
