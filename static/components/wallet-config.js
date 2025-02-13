window.app.component('wallet-config', {
  name: 'wallet-config',
  template: '#wallet-config',
  delimiters: ['${', '}'],

  props: ['total', 'config-data', 'adminkey'],
  emits: ['update:config-data'],
  data: function () {
    return {
      networkOptions: ['Mainnet', 'Testnet'],
      internalConfig: {},
      show: false
    }
  },

  computed: {
    config: {
      get() {
        return this.internalConfig
      },
      set(value) {
        value.isLoaded = true
        this.internalConfig = JSON.parse(JSON.stringify(value))
        this.$emit(
          'update:config-data',
          JSON.parse(JSON.stringify(this.internalConfig))
        )
      }
    }
  },

  methods: {
    satBtc(val, showUnit = true) {
      return satOrBtc(val, showUnit, this.config.sats_denominated)
    },
    updateConfig: async function () {
      try {
        const {data} = await LNbits.api.request(
          'PUT',
          '/watchonly/api/v1/config',
          this.adminkey,
          this.config
        )
        this.show = false
        this.config = data
      } catch (error) {
        LNbits.utils.notifyApiError(error)
      }
    },
    getConfig: async function () {
      try {
        const {data} = await LNbits.api.request(
          'GET',
          '/watchonly/api/v1/config',
          this.adminkey
        )
        this.config = data
      } catch (error) {
        LNbits.utils.notifyApiError(error)
      }
    }
  },
  created: async function () {
    await this.getConfig()
  }
})
