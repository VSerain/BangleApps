(function(back) {
  E.showMenu({
    "" : { "title" : "Custom GadgetBridge" },
    "< Back" : back,
    "Connected" : { value : NRF.getSecurityStatus().connected? "Yes" : "No"},
  });
})
