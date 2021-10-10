module.exports = {
  devServer: {
    progress: false,
  },
  pluginOptions: {
    apollo: {
      enableMocks: false,
      enableEngine: false,
      lintGQL: false,
    },
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false,
      extras: ["material-icons"],
    },
  },

  transpileDependencies: ["quasar"],
};
