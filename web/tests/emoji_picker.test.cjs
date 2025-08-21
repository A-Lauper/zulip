"use strict";

const assert = require("node:assert/strict");

const _ = require("lodash");

const {make_user} = require("./lib/example_user.cjs");
const {zrequire, set_global, mock_esm} = require("./lib/namespace.cjs");
// (async () => {
//     const {set_current_user} = zrequire("state_data");
//     const people = zrequire("people");
//     const user = make_user({
//         user_id: 22,
//         email: "alice@example.com",
//         full_name: "Alice",
//     });

function noop() {}

const reactions = mock_esm("../../web/src/reactions", {
    get_frequently_used_emojis_for_user_ajax: noop,
});

const {run_test} = require("./lib/test.cjs");

const emoji = zrequire("emoji");
const emoji_picker = zrequire("emoji_picker");

const emoji_codes = zrequire("../../static/generated/emoji/emoji_codes.json");
// const blueslip = require("./lib/zblueslip.cjs");
const people = zrequire("people");
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

// then maybe further down
// reactions.get_frequently_used_emojis_for_user_ajax = () => Promise.resolve(["grinning", "thumbsup", "heart_eyes"]);

// // Import real code.
// const reactions = zrequire('reactions');

// // And later...
// reactions.get_frequently_used_emojis_for_user_ajax = function () {
//     return Promise.resolve(["grinning", "thumbsup", "heart_eyes"]);
// };

// const {JSDOM} = require("jsdom");
// const {window} = new JSDOM("", {url: "https://localhost:9991/"});
// set_global("window", window);
// set_global("document", window.document);
// set_global("node", window.Node);
// set_global("HTMLAnchorElement", window.HTMLAnchorElement);

// const reminder = mock_esm("../../web/src/reminder", {
//     is_deferred_delivery: noop,
// });

// // then maybe further down
// reminder.is_deferred_delivery = () => true;

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

// window.location.href = "https://localhost:9991/";
run_test("initialize", async () => {
    console.log(111);
    reactions.get_frequently_used_emojis_for_user_ajax = () =>
        Promise.resolve(["+1", "tada", "slight_smile", "heart", "working_on_it", "octopus"]);
    console.log("Initializing emoji...", user.user_id);
    emoji.initialize({
        realm_emoji: {},
        emoji_codes,
    });
    console.log(112);
    // blueslip.expect("error", "Failed to rebuild emoji catalog");

    await emoji_picker.initialize();
    console.log(113);
    // await new Promise((r) => setTimeout(r, 100));
    console.log(114);
    const complete_emoji_catalog = _.sortBy(emoji_picker.complete_emoji_catalog, "name");
    console.log("EMOJI complete_emoji_catalog.length:", complete_emoji_catalog.length);
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
    function assert_category(icon, expected_count) {
        const category = complete_emoji_catalog.find((cat) => cat.icon === icon);
        assert.ok(category, `Category with icon ${icon} not found`);
        assert_emoji_category(category, icon, expected_count);
    }

    assert_category("fa-car", 195);
    assert_category("fa-hashtag", 223);
    assert_category("fa-smile-o", 168);
    assert_category("fa-star-o", popular_emoji_count);
    assert_category("fa-thumbs-o-up", 385);
    assert_category("fa-lightbulb-o", 262);
    assert_category("fa-cutlery", 135);
    assert_category("fa-flag", 269);
    assert_category("fa-cog", 1);
    assert_category("fa-leaf", 153);
    assert_category("fa-soccer-ball-o", 85);

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
