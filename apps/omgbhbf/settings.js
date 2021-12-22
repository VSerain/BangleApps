(function(back) {
  E.showMenu({
    "" : { "title" : "Find My Phone" },
    "< Back" : back,
    "Phone Connected" : { value: NRF.getSecurityStatus().connected? "Yes" : "No"},
    "On" : _=> global.GadgetBridge.findPhone(true),
    "Off" : _=> global.GadgetBridge.findPhone(false),
  });
})
