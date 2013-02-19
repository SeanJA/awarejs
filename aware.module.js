var a, aware = {
    /**
     * The empty reader object
     */
    reader: {},
    /**
     * Default settings
     */
    settings: {
        // the items to select from the page
        cssSelectors: '.post',
        // the class to add to stuff that has not been seen
        newClass: 'new',
        // the class to add to stuff that has been seen
        seenClass: 'seen',
        // the attribute to use as the date of the post
        dateAttribute: 'data-pubDate',
        // by default, leave things new if they are an hour old or less
        bufferTime: 60 * 60 * 1000
    },
    /**
     * Initialize the class
     */
    init: function (options) {
        a = this.settings;
        //merge the options array in
        $.extend(a, options);
        this.setReader();
        this.setTimeOfDay(new Date().getHours());
    },
    /**
     * Reset everything (clear the local storage)
     */
    reset: function () {
        localStorage.removeItem('lastVisit');
    },
    /**
     * Set the last visit
     */
    setLastVisit: function (date) {
        localStorage.setItem('lastVisit', date);
    },
    /**
     * Get the last visit
     */
    getLastVisit: function () {
        var maybeLastVisit = localStorage.getItem('lastVisit');
        return !isNaN(new Date(maybeLastVisit)) ? maybeLastVisit : null;
    },
    /**
     * Pluralize a string
     * @param num int The number of things
     * @param str string The string
     */
    pluralizeString: function (num, str) {
        if (num == 1) {
            return str;
        } else {
            return str + 's';
        }
    },
    /**
     * Get a relative timestamp to the one passed in
     * @param ms int The timestamp in milliseconds
     */
    relativeTimestamp: function (ms) {
        var seconds = Math.floor(ms / 1000);

        if (seconds < 60) {
            return seconds + this.pluralizeString(seconds, ' second');
        }

        var minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return minutes + this.pluralizeString(minutes, ' minute');
        }

        var hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return hours + this.pluralizeString(hours, ' hour');
        }

        var days = Math.floor(hours / 24);
        if (days < 7) {
            return days + this.pluralizeString(days, ' day');
        }

        var weeks = Math.floor(days / 7);
        return weeks + this.pluralizeString(weeks, ' week');
    },
    /**
     * Set the reader object up
     */
    setReader: function () {
        var reader = {
            morning: false,
            afternoon: false,
            lunchtime: false,
            daytime: false,
            nighttime: false
        };
        var lastVisit = this.getLastVisit();
        var now = new Date();
        if (!lastVisit) {
            this.setLastVisit(now);
            $('body').addClass('first-visit');
            reader.lastVisit = now;
            reader.firstVisit = true;
            reader.secondsSinceLastVisit = 0;
        } else {
            lastVisit = new Date(lastVisit);
            reader.lastVisit = lastVisit;

            if (now - lastVisit > 86400000) {
                $('body').addClass('first-visit-of-day');
                $('body').addClass('repeat-visitor');
                reader.firstVisitOfDay = true;
                reader.repeatVisitor = true;

            } else {
                if (!$('body').hasClass('first-visit')) {
                    $('body').addClass('repeat-visitor');
                    reader.repeatVisitor = true;
                }
            }
        }

        if (!reader.firstVisit) {
            $(a.cssSelectors).each(function () {
                // find the date element
                var postDate = $(this).attr(a.dateAttribute);
                if (postDate) {
                    var arr = postDate.split(/[- :]/);
                    var postTimestamp = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
                    if (postTimestamp > lastVisit - a.bufferTime) {
                        $(this).addClass(a.newClass);
                    } else {
                        $(this).addClass(a.seenClass);
                    }

                }
            });
        }
        reader.secondsSinceLastVisit = Math.floor((now - lastVisit) / 1000);
        reader.timeSinceLastVisit = this.relativeTimestamp(now - lastVisit);
        //store the reader object in the aware object
        this.reader = reader;
        this.setLastVisit(now);
    },
    /**
     * What time of day is it? 
     * Is it sunny or dark?
     * Is it lunch time? Or late night?
     * 
     * 4-7 early morning
     * 7-11 morning / breakfast time
     * 11-13 noonish / lunch time
     * 13-16 afternoon
     * 16-19 early evening
     * 19-21 evening / dinner time
     * 21-23 night
     * 23-4 latenight
     * 7-19 daytime
     * 19-7 nighttime
     * 
     * @param time_of_day date The date object
     */
    setTimeOfDay: function (time_of_day) {
        this.reader.morning = this.reader.afternoon = this.reader.lunchtime = this.reader.daytime = this.reader.nighttime = false;
        if (time_of_day >= 4 && time_of_day < 6) {
            this.reader.time_of_day = 'early';
        } else if (time_of_day >= 6 && time_of_day < 8) {
            this.reader.time_of_day = 'earlymorning';
            this.reader.morning = true;
        } else if (time_of_day >= 8 && time_of_day < 11) {
            this.reader.time_of_day = 'latemorning';
            this.reader.morning = true;
        } else if (time_of_day >= 11 && time_of_day < 13) {
            this.reader.time_of_day = 'noonish';
            this.reader.afternoon = true;
            this.reader.lunchtime = true; // this is an illusion.
        } else if (time_of_day >= 13 && time_of_day < 16) {
            this.reader.time_of_day = 'afternoon';
            this.reader.afternoon = true;
        } else if (time_of_day >= 16 && time_of_day < 19) {
            this.reader.time_of_day = 'earlyevening';
            this.reader.afternoon = true;
        } else if (time_of_day >= 19 && time_of_day < 21) {
            this.reader.time_of_day = 'evening';
        } else if (time_of_day >= 21 && time_of_day < 23) {
            this.reader.time_of_day = 'night';
        } else if (time_of_day >= 23 || time_of_day < 4) {
            this.reader.time_of_day = 'latenight';
        }

        if (time_of_day >= 6 && time_of_day < 19) {
            this.reader.daytime = true;
            $('body').addClass('daytime');

        } else {
            this.reader.nighttime = true;
            $('body').addClass('nighttime');
        }

        if (this.reader.morning) {
            $('body').addClass('morning');
        }
        if (this.reader.afternoon) {
            $('body').addClass('afternoon');
        }

        $('body').addClass(this.reader.time_of_day);
    }
};