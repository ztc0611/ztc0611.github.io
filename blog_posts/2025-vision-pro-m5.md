<!--
title: Thoughts on Apple Vision Pro (M5) after the demo
date: 2025-10-27
time: 21:30
description: My thoughts on the Apple Vision platform in 2025, from the outside looking in.
image: /blog_assets/vp-style.jpg
-->

<!--img 
    src: ~/vp-style.webp
    alt: An image of the Vision Pro, slick marketing photo. It is pointing vertical (screen upwards) instead of its normal orientation, horizontal.
-->

It's been about 18 months since the Vision Pro (M2) came out. I have been following it pretty closely since WWDC 2023. It has been interesting to watch the developments along the way, from big upgrades to Personas to features like the new widgets. On launch day, I decided to check out the new model.

My knowledge of the platform: I've been following since WWDC 2023. I did a demo the day it came out, and 2 more demos across the time after, each in different stores. I have watched many of the developer videos about it across the time since WWDC'23. I also attended the two day "Create immersive media experiences for visionOS" developer session (remotely) on the 21st/22nd of October this year. I have 3 apps on Apple platforms, one of which has a native visionOS port, but I've never gotten to use it on actual hardware.

In my time I have used the HTC Vive, Meta Quest 2, Meta Quest 3s, and Valve Index (demo). My favorite VR app of all time is Google Earth VR.[^If only Google shared similar feelings. I'm sure it will stop working one day, it's already getting pretty long in the tooth. Last updated August 2017, which startles me to say was 8 years ago.]

I did a demo on October 22nd, the day the M5 model came out. The employees seemed pretty excited, and a few people walked by while I was doing my demo and asked about the new hardware. I told the employee early on in our conversation that I develop apps, and after that point she mostly let me drive while we chatted.

# Hardware Experience

It's such a beautiful piece of hardware, and while there are aspects of it that are a little dorky, I think it might be the platonic ideal for headsets with current technology.

It is almost ridiculous how much more comfortable the new Dual Knit Band is. Despite being a decent bit heavier, it feels significantly lighter. Apple usually has balancing down to perfection in their other devices, so the 1st generation not employing this technique is very strange.

<!--img 
    src: ~/vp-bands.webp
    alt: An image of all 3 Vision Pro bands. Top left shows the Solo Knit Band, which only attaches to the back of the user's head and is adjusted with a dial. Top right shows the Dual Loop, which holds both onto the back and top of the head, adjusted with a velcro strap. Bottom middle shows the Dual Knit Band, which has support both on the back and top of the head, each adjusted with the same dial that you can pop in/out to select.
    source: Apple Newsroom, combined by me
-->

I was a fan of the Solo Knit Band's design and adjustment dial from the first generation, but even across my brief experiences with it, I could tell that it was never going to work out. How we ever ended up in a situation where the 1st generation shipped with two bands instead of one that combines both strengths is a mystery to me. I never tried the Dual Loop, but it seemed the obvious practical choice even when factoring in that I hate velcro straps for these kinds of devices.

I'm continually shocked by how clear the screens are, every time I convince myself it's just rose tinted glasses. The faster refresh rate, and "10% extra pixels rendered"[^To this day, I'm not entirely sure what the "renders 10% more pixels" metric is supposed to be tracking. I originally thought it was an increased "full quality" zone as part of the foveated rendering, but I'm now under the impression that it's some kind of super sampling? The footnote attached on the official site helpfully notes "Compared with Apple Vision Pro (M2)." Clear as mud guys.] made text easier on the eyes. Much easier to read iPhone screen through the headset than I remember. Didn't notice the foveated zone moving anymore, no matter how fast I looked around. I have seen some reviews claim the M5 helped with this, but I may have just lost my touch in catching it. Still loses eye tracking precision near the edge of the frame. (Works perfectly closer to the center.)

# Software Experience

It really reminds me of my first iPhone, or the MacBook running 10.6 Snow Leopard I got when I was 10. Sharp, beautiful, precise.

They really thought of every last detail when making a new platform. Ridiculous things I'd have never considered in a million years like it not censoring passwords because there's nobody else to see you typing them. I've not encountered this on any other AR/VR device but maybe someone else did think of it first. The fact that popups appear on the same plane as the current window and the main window actually "steps back" behind the popup is another stroke of genius.

It's continually obvious eye and hand tracking first is the only way forward, with 6DOF game controllers being an accessory only for gamers. I find this to be a continually undersold aspect of the platform. They were right to pick hand tracking over game controllers if only one could make it for launch. I've tried to get family members to use the ones with controllers, and it frustrates them very quickly. I've gotten some of the same people to try these gestures, and they have taken to them extremely fast. Apple really has something here for when the hardware gets cheaper.

visionOS has gone from feeling like a late stage polished tech demo to actually feeling like an operating system you could use to get something done. (I still wanted it even when it was a tech demo, lol.) When I said they thought of every detail, it was re-imagining the basics. In V1 they had still failed to do basic things like letting you rearrange apps on the Home Screen. Near the end, I pulled a 3D model out of Files and found it very hard to make it go away, not in alignment of Apple's normal UX.

Final comment on software; it's nice that you can browse the App Store on the demo units even if you can't download anything. It was cool to see my own app.[^You can [try it out](https://apps.apple.com/us/app/recall-moving-gallery/id6747688430) if you want, but I'm not super happy with how slow it can be to start when you have iCloud Photos enabled. (Tried a lot of workarounds, unfortunately couldn't get it much faster.) If you're a Vision Pro user, let me know if you do!]

<!--img 
    src: ~/vp-my-app.webp
    alt: Image of the iPad which is used to direct Vision Pro demos. On it there is a small window showing the perspective of the Vision Pro user (me) looking at my photo memory app, Recall.
    source: Meeeeeee
-->

# Photos, Videos

I am pretty obsessed with photos. I took 9,637 photos last year, and currently have taken 8,235 so far this year[^On track to beat my number from last year! Just gotta keep it up!] How do I know this? I made a basic app that breaks it into a bar graph. (lol) To me, using the Vision Pro to look at pictures, videos, spatial media, panoramas, blah would be one of my favorite use cases.

I have taken 427 spatial videos, and 160 spatial photos. All were shot on an iPhone 15 Pro (mine) or 16 Pro (borrowing friend's). You are allowed to take 10 into the demo, and I selected a few spatial videos, 2 panoramas, a spatial photo, and 2 normal photos.

I've been very curious to try spatial scenes, and after trying them on my own photo I am not very impressed. People talk about it like it makes spatial photos obsolete, and I don't really agree. They look odd, mostly in how the perspective moves. I find it convincingly predicts the depth, but I'm just not a fan. I will likely shoot more spatial photos going forward. However, their limitations (cropping, etc) are sad, even though they're non-trivial or impossible for Apple to fix.

<!--img 
    src: ~/san-juan-may.heic
    class: spatial
    alt: Stereoscopic spatial image of a pacific northwest coastline during the golden hour near sunset. The sky is mostly clear and blue. It is taken semi-parallel to a steep shoreline. The water is on the left, land to the right. The grass and weeds are tall, a mix of yellow and green. You can see many pine trees in the distance as the coastline wraps around. Far in the distance on the left, you can see mountains.
    caption: Hopefully, a spatial photo for anyone reading on Vision. Normal picture for us squares.\nI've never actually seen this one on device. Simulator seems to work correctly?[^I discovered a bug(?) during this process in which it turns out that a spatial photo cannot have a space in its file name in a <source> tag on Safari. Spatial works with spaces specifically in the a <img> tag, but that has no fallback for other browsers. I asked someone for a sanity check and they told me I should never expect spaces to work right with file names on the web.]
    source: Me
-->

Spatial videos are incredible. I have one I took just a few days ago in the rain on Orcas Island in Washington and I was blown away by how I could see the rain drops falling in the immersive view. The store was loud enough that I couldn't really tell the audio difference between the footage from the 15 Pro and the 16 Pro. (Maybe it's just not very noticeable in the first place.) They talked a lot about spatial video in that developer session I went to, as well as immersive video. It gave me an idea for a stupid camera rig, which I am playing around with concepts to make.[^Two iPhones in landscape mode, but rotated to have their primary cameras in horizontal alignment. [(Visual Aid)](/blog_assets/dumb-camera-rig.jpg) 16:9 Spatial, hopefully in 4K/HDR. Fixes the ultra wide camera problem, and the smaller depth of field due to the iPhone shooters being close together. You can position them at right about 2.5in from my napkin measurements. Some kind of ramshackle system to press record on both at the same time so they don't need genlock. I am not sure if the spatial video format could take all of this, however. Also not sure how best to handle audio.]

Immersive video is very impressive, and while they did spend a lot of time during that developer session talking about it, it's kind of moot because it requires $50,000 of equipment if we're being generous. I look forward to watching the content they've created for it when the day comes that I own a VP. It's super cool to hear all of the technical aspects of how filmmaking rules change, but I'm not a video expert, I'm way more on the photos side. (Would like to change that someday!) I would still like to try one of the BlackMagic immersive cameras out someday, maybe in the 2050s I can find one on eBay.

*Random soapbox while we're here:* I will mourn the Days view from the Photos app forever. It's so sad that best I can tell it was removed purely because having it fit in the iPhone UI would be inconvenient. I really liked how you could zoom in and out on your photo library and chronologically scroll through days, something the worse Recent Days replacement does not allow. It's funny to me that when the Vision Pro (M2) was announced at WWDC'23, the very first thing it was ever shown doing was opening Photos to the Days view. If only I could do that someday…

<!--img
    src: ~/vp-days-view.webp
    alt: Image showing the visionOS 1 native Photos app, selected to the Days view. The Days view lays out photos in a nicer arrangement than the typical rigid grid used in All Photos, the only remaining view as of late 2024.
    source: Apple WWDC 2023 / 1:22:51 [Youtube](https://www.youtube.com/live/GYkq9Rgoj8E?si=V_qDCeepD9v4PcTx&t=4971)
-->

# Thoughts on Future

Overall, the reaction to this device in the tech space has been extremely perplexing to me. Even in 2024, it seemed like everybody was clamoring for it to fail. Yes, it is too expensive, and yes it's a bit too heavy. But I just don't get how people see to be missing the endgame here.

The screens are already very sharp and are only going to get sharper with time. It's big but it will get smaller with time. This is very early into a new paradigm that I believe will replace even more electronic devices than the iPhone.

* Do you have a desk with a monitor? This can do that. Do you wish you had more than one if you do? This can do that. Three, Four, Five, Six? Maybe one day!
* Do you wish you had a nicer TV with a great sound system? This can do that.
* Do you wish you had a larger iPad that didn't tire your hands? This can do that.

All of this, and it can do anywhere you can carry a small pouch, for one single price. The use cases will only add on as time progresses.

I get it, the winning form factor that flies off the shelves will likely end up being glasses, but I think there will be two classes of this for a long time to come. Glasses = Phone, Headset = Laptop/iPad. You're just not going to get enough processing power and battery to knock the headset form factor out anytime soon. The iPhone Air offers a hint at what that miniaturization might look like, but it's going to take time.

<!--img 
    src: ~/iphone-air-inside.webp
    alt: Image of the inside of the iPhone Air. All of the important pieces of the phone are near the top under the camera bump. The rest is just a large battery.
    caption: Note the guts being centralized at the top of the device and being overall pretty small.
    source: Apple Newsroom
-->

I think that it's very likely that this technology (in glasses) will smash the iPhone out of common memory by the time I'm old. People have already started to memory hole the iPod, one day the iPhone might share the same fate. If that happens, it will seem retroactively so absurd and antiquated that everybody ever called the iPhone the "one device."

Much ink has been spilled about if this product line is already over, and given the sheer amount of effort being put into Apple Immersive (streaming, new productions, new cameras)… I just don't think that's the case. I don't see a world where the glasses are capable of playing it back in anywhere as impressive of a way anytime soon.

This is not my pitch to tell you to run out and buy one right now, but I do find a large portion of the gripes very short sighted.

# Development Annoyances

As I said earlier, I make apps as a hobby.

It's very frustrating to me how limited the simulator is, and how there are basically no programs to try and address this. I am aware I wouldn't be important enough for a loaner program, but even being able to borrow a demo unit for an hour in the store during a slow period in the week would be a huge help. I think that the development environment would be a lot healthier if Apple put more effort into getting this into smaller developer's hands, by any means they can muster.

The simulator is basically useless once you graduate past flat apps, even for things that really should work. For example, the TableTopKit demo project just spawns the table floating over a couch when you load in, despite the fact that the default environment literally has 2 tables. I know that things like ARKit probably couldn't be emulated to any meaningful degree, but some more aggressive attempts at making more complex APIs work in the simulator would be nice, if no hardware lending is going to happen.

I have a few ideas for app concepts I'd like to try, but the ones that take advantage of the platform beyond being a floating iPad basically require you to own one. That's a bummer.

# Final Thoughts

The M5 upgrade seems to be pretty nice. The bumps felt noticeable, but not completely game changing. I imagine in the future there will be AI features exclusive to the M5 version due to how much acceleration it has gotten. I find it extremely weird that it didn't get WiFi 6E/7, remaining on 6. 256GB of storage base for a $3,499 device is too low.

I'd have walked out of the store that day with one if I could afford it, and I would have done the same the other 3 times. But unfortunately it's not in the cards. Maybe someday.
