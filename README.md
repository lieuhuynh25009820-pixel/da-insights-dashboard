# Hotel Booking Demand Intelligence

Interactive dashboard from the cleaned file `hotel_bookings_fully_cleaned-official.xlsx` (86,618 bookings) and three studies:

- **Data Analysis 1**
- **Data Analysis 2**
- **Data Analysis 3**

## Deploy (free)

This is a static site. **GitHub Pages** and **Netlify** both host it at $0.

This Mac cannot run Git yet (Xcode Command Line Tools are missing). After you install them (`xcode-select --install`), ask to publish to GitHub Pages for a lasting public URL.

## Open on localhost

From this folder:

```bash
ruby -run -e httpd . -p 8765
```

Then open http://127.0.0.1:8765/

## Tabs

1. Portfolio health  
2. Season & pricing  
3. Channels & guest mix  
4. Arrival-risk signals  
5. Insights & recommendations  

Revenue = ADR × (weekend nights + weekday nights).
