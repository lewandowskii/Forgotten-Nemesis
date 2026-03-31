Component({
  properties: {
    action: {
      type: Object,
      value: {},
    },
  },

  data: {},

  methods: {
    handleExecute() {
      const { action = {} } = this.properties;
      const disabledStatuses = ["executing", "completed", "dismissed"];
      if (!action.id || disabledStatuses.includes(action.status)) {
        return;
      }
      this.triggerEvent("execute", {
        actionId: action.id,
      });
    },
  },
});
