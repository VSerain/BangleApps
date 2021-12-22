(function(back) {
  E.showMenu({
    "" : { "title" : "Custom GadgetBridge" },
    "< Back" : back,
    "Connected" : { value : NRF.getSecurityStatus().connected? "Yes" : "No"},
    "Find Phone" : () => E.showMenu({
        "" : { "title" : "Find Phone" },
        "< Back" : ()=>E.showMenu(mainmenu),
        "On" : _=> global.GadgetBridge.findPhone(true),
        "Off" : _=> global.GadgetBridge.findPhone(false),
      }),
  });
})
