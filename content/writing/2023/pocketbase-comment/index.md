---
title: "PocketBase"
description: "ini adalah deskripsi dari frontmatter"
summary: "ini adalah summary nya dari frontmatter. kalau tidak diisi, otomatis ambil rangkuman artikel"
date: 2023-06-15T21:09:42.2150299+08:00
lastmod: 2023-06-16T20:28:26.0161062+08:00
draft: false
author: "Faiq Najib"
toc: true
comments: true
images:
tags:
  - untagged
  - coba
---

Since switching to a static blog system,...

# Testing

The first one was Valine[^1]


Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

# Heading 1

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

## Heading 2

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

### Heading 3

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

#### Heading 4

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

##### Heading 5

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

###### Heading 6

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

## Typography

Lid est laborum et dolorum fuga, This is [an example](http://example.com/ "Title") inline link. Et harum quidem rerum facilis, **This is bold** and *emphasis* cumque nihilse impedit quo minus id quod amets untra dolor amet sad. While this is `code block()` and following is a `pre` tag

	print 'this is pre tag'

Following is the syntax highlighted code block

```go
func getCookie(name string, r interface{}) (*http.Cookie, error) {
	rd := r.(*http.Request)
	cookie, err := rd.Cookie(name)
	if err != nil {
		return nil, err
	}
	return cookie, nil
}

func setCookie(cookie *http.Cookie, w interface{}) error {
	// Get write interface registered using `Acquire` method in handlers.
	wr := w.(http.ResponseWriter)
	http.SetCookie(wr, cookie)
	return nil
}
```

This is blockquote, Will make it *better now*

> 'I want to do with you what spring does with the cherry trees.' <cite>cited ~Pablo Neruda</cite>*


> Et harum quidem *rerum facilis* est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit

Unordered list

*   Red
*   Green
*   Blue

Ordered list

1.	Red
2.  Green
3.  Blue

![demo](https://placehold.co/600x400/webp)

{{< figure src="https://placehold.co/720x1080/webp" alt="image" caption="figure-left" class="left" >}}

{{< figure src="https://via.placeholder.com/1600x800" alt="image" caption="figure-big" class="big" >}}

[^1]: [Introduction | Valine A fast, simple and efficient comment system without backend. ](https://valine.js.org/)
