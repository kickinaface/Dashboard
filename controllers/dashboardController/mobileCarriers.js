function MobileCarriers() {
    this.carriers = [
        {
            name:"Alltel",
            domain: "sms.alltelwireless.com"
        },
        {
            name:"AT&T",
            domain:"txt.att.net"
        },
        {
            name: "Boost Mobile",
            domain: "sms.myboostmobile.com"
        },
        {
            name:"Consumer Cellular",
            domain: "mailmymobile.net"
        },
        {
            name:"Cricket Wireless",
            domain:"mms.cricketwireless.net"
        },
        {
            name:"Google Fi",
            domain:"msg.fi.google.com"
        },
        {
            name:"H2O Wireless",
            domain:"txt.att.net"
        },
        {
            name:"Metro PCS",
            domain:"mymetropcs.com"
        },
        {
            name:"Republic Wireless",
            domain:"text.republicwireless.com"
        },
        {
            name:"Sprint",
            domain:"messaging.sprintpcs.com"
        },
        {
            name:"Straight Talk",
            domain:"@vtext.com"
        },
        {
            name:"T-Mobile",
            domain:"tmomail.net"
        },
        {
            name:"Ting",
            domain: "message.ting.com"
        },
        {
            name:"U.S. Cellular",
            domain:"email.uscc.net"
        },
        {
            name:"Verizon Wireless",
            domain:"vtext.com"
        },
        {
            name:"Virgin Mobile",
            domain:"vmobl.com"
        }
    ];
};

var mobileCarriers = new MobileCarriers();
module.exports = mobileCarriers;