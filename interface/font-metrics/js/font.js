var font = (function () {
    var test_string = 'mmmmmmmmmwwwwwww';
    var test_font = '"Comic Sans MS"';
    var notInstalledWidth = 0;
    var testbed = null;
    var guid = 0;
    
    return {
        // must be called when the dom is ready
        setup : function () {
            if ($('#fontInstalledTest').length) return;

            $('head').append('<' + 'style> #fontInstalledTest, #fontTestBed { position: absolute; left: -9999px; top: 0; visibility: hidden; } #fontInstalledTest { font-size: 50px!important; font-family: ' + test_font + ';}</' + 'style>');
            
            
            $('body').append('<div id="fontTestBed"></div>').append('<span id="fontInstalledTest" class="fonttest">' + test_string + '</span>');
            testbed = $('#fontTestBed');
            notInstalledWidth = $('#fontInstalledTest').width();
        },
        
        isInstalled : function(font) {
            guid++;
        
            var style = '<' + 'style id="fonttestStyle"> #fonttest' + guid + ' { font-size: 50px!important; font-family: ' + font + ', ' + test_font + '; } <' + '/style>';
            
            $('head').find('#fonttestStyle').remove().end().append(style);
            testbed.empty().append('<span id="fonttest' + guid + '" class="fonttest">' + test_string + '</span>');
                        
            return (testbed.find('span').width() != notInstalledWidth);
        }
    };
})();