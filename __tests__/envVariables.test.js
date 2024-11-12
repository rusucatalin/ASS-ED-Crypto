describe("Environment Variables", () => {
  test("should load COINGECKO_API_KEY from the .env file", () => {
    expect(process.env.COINGECKO_API_KEY).toBe("CG-xRrvPBpdygGaycoTnKCy2wpQ");
  });

  test("should load COINGECKO_API_URL from the .env file", () => {
    expect(process.env.COINGECKO_API_URL).toBe(
      "https://api.coingecko.com/api/v3/simple/price",
    );
  });

  test("should load COINGECKO_CRYPTO_IDS from the .env file", () => {
    expect(process.env.COINGECKO_CRYPTO_ID).toBe(
      "bitcoin,ethereum,dogecoin,raydium",
    );
  });
});
