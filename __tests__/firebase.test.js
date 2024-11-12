import { jest } from "@jest/globals";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import { getAuth } from "firebase/auth";

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

describe("Firebase Connection", () => {
  let app;
  let database;
  let auth;

  beforeEach(() => {
    jest.clearAllMocks();

    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
  });

  test("should initialize Firebase app successfully", () => {
    expect(initializeApp).toHaveBeenCalled();
    expect(initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: expect.any(String),
        authDomain: expect.any(String),
        databaseURL: expect.any(String),
        projectId: expect.any(String),
        storageBucket: expect.any(String),
        messagingSenderId: expect.any(String),
        appId: expect.any(String),
      }),
    );
  });

  test("should initialize database connection", () => {
    expect(getDatabase).toHaveBeenCalled();
    expect(getDatabase).toHaveBeenCalledWith(app);
  });

  test("should initialize authentication", () => {
    expect(getAuth).toHaveBeenCalled();
    expect(getAuth).toHaveBeenCalledWith(app);
  });
});
