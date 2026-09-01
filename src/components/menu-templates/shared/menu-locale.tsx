"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MenuLocaleCode = "tr" | "en" | "ru" | "ar";

export type MenuLocaleOption = {
  code: MenuLocaleCode;
  label: string;
  dir: "ltr" | "rtl";
};

export const MENU_LOCALES: MenuLocaleOption[] = [
  { code: "tr", label: "TR", dir: "ltr" },
  { code: "en", label: "EN", dir: "ltr" },
  { code: "ru", label: "RU", dir: "ltr" },
  { code: "ar", label: "AR", dir: "rtl" },
];

export type MenuStrings = {
  welcomeTitle: string;
  welcomeSubtitle: string;
  login: string;
  continueAsGuest: string;
  register: string;
  loginTitle: string;
  registerTitle: string;
  loginDescription: string;
  registerDescription: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  googleLogin: string;
  googleRegister: string;
  noAccount: string;
  hasAccount: string;
  account: string;
  logout: string;
  orderHistory: string;
  changePassword: string;
  save: string;
  addToOrder: string;
  scanTableQr: string;
  cart: string;
  placeOrder: string;
  guest: string;
  failed: string;
  waiterLogin: string;
  waiterLoginTitle: string;
  waiterLoginDescription: string;
  username: string;
  searchCategories: string;
  poweredBy: string;
  language: string;
  currency: string;
  languageAndCurrency: string;
  selectLanguageAndCurrency: string;
  menuPanel: string;
  closeMenu: string;
  openMenu: string;
  bonAppetit: string;
  nutritionValues: string;
  allergenInfo: string;
  transparencyTitle: string;
  transparencySubtitle: string;
  energy: string;
  protein: string;
  fat: string;
  carbs: string;
  fiber: string;
  salt: string;
  addToCart: string;
  back: string;
  productUnavailable: string;
  chefRecommended: string;
};


const STRINGS: Record<MenuLocaleCode, MenuStrings> = {
  tr: {
    welcomeTitle: "Hoş geldiniz",
    welcomeSubtitle: "Devam etmek için bir seçenek belirleyin",
    login: "Giriş yap",
    continueAsGuest: "Misafir olarak devam et",
    register: "Kayıt ol",
    loginTitle: "Giriş yap",
    registerTitle: "Kayıt ol",
    loginDescription: "Hesabınıza giriş yapın.",
    registerDescription: "Sadakat ve sipariş geçmişi için üye olun.",
    firstName: "Ad",
    lastName: "Soyad",
    email: "E-posta",
    password: "Şifre",
    passwordConfirm: "Şifre tekrar",
    googleLogin: "Google ile giriş yap",
    googleRegister: "Google ile kayıt ol",
    noAccount: "Hesabınız yok mu? Kayıt ol",
    hasAccount: "Zaten üye misiniz? Giriş yap",
    account: "Hesabım",
    logout: "Çıkış yap",
    orderHistory: "Sipariş geçmişi",
    changePassword: "Şifre değiştir",
    save: "Kaydet",
    addToOrder: "Siparişe ekle",
    scanTableQr: "Sipariş vermek için masanızdaki QR kodu okutun.",
    cart: "Sepet",
    placeOrder: "Sipariş ver",
    guest: "Misafir",
    failed: "İşlem başarısız",
    waiterLogin: "Garson girişi",
    waiterLoginTitle: "Garson girişi",
    waiterLoginDescription: "Kullanıcı adı ve şifrenizle giriş yapın.",
    username: "Kullanıcı adı",
    searchCategories: "Kategori ara...",
    poweredBy: "Powered by AlgoryQR",
    language: "Dil",
    currency: "Kur",
    languageAndCurrency: "Dil ve kur",
    selectLanguageAndCurrency: "Dil ve kur seç",
    menuPanel: "Menü",
    closeMenu: "Kapat",
    openMenu: "Menü",
    bonAppetit: "Afiyet olsun!",
    nutritionValues: "Besin Değerleri",
    allergenInfo: "Alerjen Bilgisi",
    transparencyTitle: "Bilgilendirme şeffaflığı",
    transparencySubtitle: "İçindekiler ve alerjen bilgileri",
    energy: "Enerji",
    protein: "Protein",
    fat: "Yağ",
    carbs: "Karbonhidrat",
    fiber: "Lif",
    salt: "Tuz",
    addToCart: "Sepete Ekle",
    back: "Geri",
    productUnavailable: "Bu ürün şu an mevcut değil.",
    chefRecommended: "Şef önerisi",
  },
  en: {
    welcomeTitle: "Welcome",
    welcomeSubtitle: "Choose how you want to continue",
    login: "Sign in",
    continueAsGuest: "Continue as guest",
    register: "Sign up",
    loginTitle: "Sign in",
    registerTitle: "Sign up",
    loginDescription: "Sign in to your account.",
    registerDescription: "Join for loyalty and order history.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    passwordConfirm: "Confirm password",
    googleLogin: "Sign in with Google",
    googleRegister: "Sign up with Google",
    noAccount: "No account? Sign up",
    hasAccount: "Already a member? Sign in",
    account: "My account",
    logout: "Log out",
    orderHistory: "Order history",
    changePassword: "Change password",
    save: "Save",
    addToOrder: "Add to order",
    scanTableQr: "Scan your table QR code to place an order.",
    cart: "Cart",
    placeOrder: "Place order",
    guest: "Guest",
    failed: "Something went wrong",
    waiterLogin: "Waiter login",
    waiterLoginTitle: "Waiter login",
    waiterLoginDescription: "Sign in with your username and password.",
    username: "Username",
    searchCategories: "Search categories...",
    poweredBy: "Powered by AlgoryQR",
    language: "Language",
    currency: "Currency",
    languageAndCurrency: "Language & currency",
    selectLanguageAndCurrency: "Select language and currency",
    menuPanel: "Menu",
    closeMenu: "Close",
    openMenu: "Menu",
    bonAppetit: "Enjoy your meal!",
    nutritionValues: "Nutrition Facts",
    allergenInfo: "Allergen Information",
    transparencyTitle: "Information transparency",
    transparencySubtitle: "Ingredients and allergen details",
    energy: "Energy",
    protein: "Protein",
    fat: "Fat",
    carbs: "Carbs",
    fiber: "Fiber",
    salt: "Salt",
    addToCart: "Add to Cart",
    back: "Back",
    productUnavailable: "This item is currently unavailable.",
    chefRecommended: "Chef's pick",
  },
  ru: {
    welcomeTitle: "Добро пожаловать",
    welcomeSubtitle: "Выберите способ продолжения",
    login: "Войти",
    continueAsGuest: "Продолжить как гость",
    register: "Регистрация",
    loginTitle: "Войти",
    registerTitle: "Регистрация",
    loginDescription: "Войдите в свой аккаунт.",
    registerDescription: "Зарегистрируйтесь для истории заказов.",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Эл. почта",
    password: "Пароль",
    passwordConfirm: "Повторите пароль",
    googleLogin: "Войти через Google",
    googleRegister: "Регистрация через Google",
    noAccount: "Нет аккаунта? Регистрация",
    hasAccount: "Уже есть аккаунт? Войти",
    account: "Мой аккаунт",
    logout: "Выйти",
    orderHistory: "История заказов",
    changePassword: "Сменить пароль",
    save: "Сохранить",
    addToOrder: "Добавить в заказ",
    scanTableQr: "Отсканируйте QR стола, чтобы сделать заказ.",
    cart: "Корзина",
    placeOrder: "Оформить заказ",
    guest: "Гость",
    failed: "Не удалось выполнить",
    waiterLogin: "Вход официанта",
    waiterLoginTitle: "Вход официанта",
    waiterLoginDescription: "Войдите с именем пользователя и паролем.",
    username: "Имя пользователя",
    searchCategories: "Поиск категорий...",
    poweredBy: "Powered by AlgoryQR",
    language: "Язык",
    currency: "Валюта",
    languageAndCurrency: "Язык и валюта",
    selectLanguageAndCurrency: "Выберите язык и валюту",
    menuPanel: "Меню",
    closeMenu: "Закрыть",
    openMenu: "Меню",
    bonAppetit: "Приятного аппетита!",
    nutritionValues: "Пищевая ценность",
    allergenInfo: "Информация об аллергенах",
    transparencyTitle: "Прозрачность информации",
    transparencySubtitle: "Состав и данные об аллергенах",
    energy: "Энергия",
    protein: "Белки",
    fat: "Жиры",
    carbs: "Углеводы",
    fiber: "Клетчатка",
    salt: "Соль",
    addToCart: "В корзину",
    back: "Назад",
    productUnavailable: "Этот продукт сейчас недоступен.",
    chefRecommended: "Рекомендация шефа",
  },
  ar: {
    welcomeTitle: "مرحباً",
    welcomeSubtitle: "اختر طريقة المتابعة",
    login: "تسجيل الدخول",
    continueAsGuest: "المتابعة كزائر",
    register: "إنشاء حساب",
    loginTitle: "تسجيل الدخول",
    registerTitle: "إنشاء حساب",
    loginDescription: "سجّل الدخول إلى حسابك.",
    registerDescription: "انضم للاطلاع على سجل الطلبات.",
    firstName: "الاسم",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordConfirm: "تأكيد كلمة المرور",
    googleLogin: "تسجيل الدخول عبر Google",
    googleRegister: "إنشاء حساب عبر Google",
    noAccount: "ليس لديك حساب؟ إنشاء حساب",
    hasAccount: "لديك حساب؟ تسجيل الدخول",
    account: "حسابي",
    logout: "تسجيل الخروج",
    orderHistory: "سجل الطلبات",
    changePassword: "تغيير كلمة المرور",
    save: "حفظ",
    addToOrder: "أضف إلى الطلب",
    scanTableQr: "امسح رمز QR الخاص بطاولتك لتقديم الطلب.",
    cart: "السلة",
    placeOrder: "إرسال الطلب",
    guest: "زائر",
    failed: "فشلت العملية",
    waiterLogin: "دخول النادل",
    waiterLoginTitle: "دخول النادل",
    waiterLoginDescription: "سجّل الدخول باسم المستخدم وكلمة المرور.",
    username: "اسم المستخدم",
    searchCategories: "البحث في الفئات...",
    poweredBy: "Powered by AlgoryQR",
    language: "اللغة",
    currency: "العملة",
    languageAndCurrency: "اللغة والعملة",
    selectLanguageAndCurrency: "اختر اللغة والعملة",
    menuPanel: "القائمة",
    closeMenu: "إغلاق",
    openMenu: "القائمة",
    bonAppetit: "بالهناء والشفاء!",
    nutritionValues: "القيم الغذائية",
    allergenInfo: "معلومات مسببات الحساسية",
    transparencyTitle: "شفافية المعلومات",
    transparencySubtitle: "المكونات ومعلومات مسببات الحساسية",
    energy: "الطاقة",
    protein: "البروتين",
    fat: "الدهون",
    carbs: "الكربohydrates",
    fiber: "الألياف",
    salt: "الملح",
    addToCart: "أضف إلى السلة",
    back: "رجوع",
    productUnavailable: "هذا المنتج غير متوفر حالياً.",
    chefRecommended: "اختيار الشيف",
  },
};


const STORAGE_KEY = "algory_menu_locale";

type MenuLocaleContextValue = {
  locale: MenuLocaleCode;
  dir: "ltr" | "rtl";
  t: MenuStrings;
  setLocale: (code: MenuLocaleCode) => void;
};

const MenuLocaleContext = createContext<MenuLocaleContextValue | null>(null);

function isLocale(value: string | null | undefined): value is MenuLocaleCode {
  return value === "tr" || value === "en" || value === "ru" || value === "ar";
}

type MenuLocaleProviderProps = {
  children: ReactNode;
  scopeKey?: string;
  defaultLocale?: MenuLocaleCode;
};

function localeStorageKey(scopeKey?: string): string {
  return scopeKey ? `${STORAGE_KEY}:${scopeKey}` : STORAGE_KEY;
}

export function MenuLocaleProvider({
  children,
  scopeKey,
  defaultLocale,
}: MenuLocaleProviderProps) {
  const [locale, setLocaleState] = useState<MenuLocaleCode>(defaultLocale ?? "tr");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(localeStorageKey(scopeKey));
      if (isLocale(stored)) {
        setLocaleState(stored);
        return;
      }
      if (defaultLocale) {
        setLocaleState(defaultLocale);
        return;
      }
      const nav = window.navigator.language.slice(0, 2).toLowerCase();
      if (isLocale(nav)) setLocaleState(nav);
    } catch {
      /* ignore */
    }
  }, [defaultLocale, scopeKey]);

  const setLocale = useCallback(
    (code: MenuLocaleCode) => {
      setLocaleState(code);
      try {
        window.localStorage.setItem(localeStorageKey(scopeKey), code);
      } catch {
        /* ignore */
      }
    },
    [scopeKey],
  );

  const option = MENU_LOCALES.find((item) => item.code === locale) ?? MENU_LOCALES[0];
  const value = useMemo<MenuLocaleContextValue>(
    () => ({
      locale,
      dir: option.dir,
      t: STRINGS[locale],
      setLocale,
    }),
    [locale, option.dir, setLocale],
  );

  return <MenuLocaleContext.Provider value={value}>{children}</MenuLocaleContext.Provider>;
}

export function useMenuLocale(): MenuLocaleContextValue {
  const ctx = useContext(MenuLocaleContext);
  if (!ctx) {
    throw new Error("useMenuLocale must be used within MenuLocaleProvider");
  }
  return ctx;
}

export function useMenuLocaleOptional(): MenuLocaleContextValue | null {
  return useContext(MenuLocaleContext);
}
