"use strict";

const assert = require("node:assert/strict");

const _ = require("lodash");

const {zrequire, set_global} = require("./lib/namespace.cjs");
const {run_test} = require("./lib/test.cjs");

const emoji = zrequire("emoji");
const emoji_picker = zrequire("emoji_picker");

const emoji_codes = zrequire("../../static/generated/emoji/emoji_codes.json");
//const blueslip = require("./lib/zblueslip.cjs");
const people = zrequire("people");
const {make_user} = require("./lib/example_user.cjs");
const {set_current_user} = zrequire("state_data");
people.init(); // Sometimes necessary to reset state for each test

const user = make_user({
        user_id: 22,
        email: "alice@example.com",
        full_name: "Alice",
    });
people.add_active_user(user);


set_current_user(user);

people.add_valid_user_id(user.user_id);

const {JSDOM} = require("jsdom");
const {window} = new JSDOM("", {url: "https://localhost:9991/"});
set_global("window", window);
set_global("document", window.document);
// set_global("node", window.Node);
// set_global("HTMLAnchorElement", window.HTMLAnchorElement);




// const reactions = zrequire("reactions");
// reactions.get_frequently_used_emojis_for_user_ajax = function () {
//     return Promise.resolve(["grinning", "thumbsup", "heart_eyes"]);
// };



// const $ = require("./lib/zjquery.cjs");
// set_global("$", $);

// override($,ajax,(options) => {
//     if (options && typeof options.success === "function") {
//         options.success({reactions: []});
//     }
//     return {
//         readyState: 4,
//         status: 200,
//         responseJSON: {reactions: []},
//     };
// });


//window.location.href = "https://localhost:9991/";
run_test("initialize", async () => {
    console.log("Initializing emoji...", user.user_id);
    emoji.initialize({
        realm_emoji: {},
        emoji_codes,
    });
    //blueslip.expect("error", "Failed to rebuild emoji catalog");

    await emoji_picker.initialize();
    await new Promise((r) => setTimeout(r, 100));
    const complete_emoji_catalog = _.sortBy(emoji_picker.complete_emoji_catalog, "name");
    assert.equal(complete_emoji_catalog.length, 11);
    assert.equal(emoji.emojis_by_name.size, 1876);

    let total_emoji_in_categories = 0;

    function assert_emoji_category(ele, icon, num) {
        assert.equal(ele.icon, icon);
        assert.equal(ele.emojis.length, num);
        function check_emojis(val) {
            for (const this_emoji of ele.emojis) {
                assert.equal(this_emoji.is_realm_emoji, val);
            }
        }
        if (ele.name === "Custom") {
            check_emojis(true);
        } else {
            check_emojis(false);
            total_emoji_in_categories += ele.emojis.length;
        }
    }
    const popular_emoji_count = 6;
    const zulip_emoji_count = 1;
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-car", 195);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-hashtag", 223);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-smile-o", 168);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-star-o", popular_emoji_count);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-thumbs-o-up", 385);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-lightbulb-o", 262);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-cutlery", 135);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-flag", 269);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-cog", 1);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-leaf", 153);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-soccer-ball-o", 85);

    // The popular emoji appear twice in the picker, and the zulip emoji is special
    assert.equal(
        emoji.emojis_by_name.size,
        total_emoji_in_categories - popular_emoji_count + zulip_emoji_count,
    );
});

run_test("is_emoji_present_in_text", () => {
    const thermometer_emoji = {
        name: "thermometer",
        emoji_code: "1f321",
        reaction_type: "unicode_emoji",
    };
    const headphones_emoji = {
        name: "headphones",
        emoji_code: "1f3a7",
        reaction_type: "unicode_emoji",
    };
    assert.equal(emoji_picker.is_emoji_present_in_text("🌡", thermometer_emoji), true);
    assert.equal(
        emoji_picker.is_emoji_present_in_text("no emojis at all", thermometer_emoji),
        false,
    );
    assert.equal(emoji_picker.is_emoji_present_in_text("😎", thermometer_emoji), false);
    assert.equal(emoji_picker.is_emoji_present_in_text("😎🌡🎧", thermometer_emoji), true);
    assert.equal(emoji_picker.is_emoji_present_in_text("😎🎧", thermometer_emoji), false);
    assert.equal(emoji_picker.is_emoji_present_in_text("😎🌡🎧", headphones_emoji), true);
    assert.equal(
        emoji_picker.is_emoji_present_in_text("emojis with text 😎🌡🎧", thermometer_emoji),
        true,
    );
    assert.equal(
        emoji_picker.is_emoji_present_in_text("emojis with text no space😎🌡🎧", headphones_emoji),
        true,
    );
});
