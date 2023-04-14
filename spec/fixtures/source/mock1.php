<!doctype html>
<html lang=en>
   <head>
      <meta charset=utf-8>
      <meta property=og:type  content="website">
      <meta property=og:image content="graphics/mock1.jpg">
      <title>🔢🔢🔢 rev-web-assets 🔢🔢🔢</title>
      <link rel=stylesheet href=https://cdn.jsdelivr.net/npm/pretty-print-json@2.0/dist/css/pretty-print-json.css>
      <link rel=stylesheet href=mock1.min.css>
      <link rel=stylesheet href=subfolder/mock2.min.css>
      <script defer src=https://cdn.jsdelivr.net/npm/pretty-print-json@2.0/dist/pretty-print-json.min.js></script>
      <script defer src=mock1.js></script>
      <script defer src=subfolder/mock2.js></script>
   </head>
   <body>
      <h1>🔢🔢🔢 rev-web-assets 🔢🔢🔢</h1>
      <?php echo '<h2>Mock #1</h2>'; ?>
      <a href=subfolder/mock2.php>Mock #2</a>
      <section id=one>
         <h3>Macaroni</h3>
         <figure class=bad><strong>&times;</strong><figcaption>Error</figcaption></figure>
         <figure class=good><strong>&check;</strong><figcaption>Ok</figcaption></figure>
      </section>
      <section id=two>
         <h3>Cheese</h3>
         <figure class=bad><strong>&times;</strong><figcaption>Error</figcaption></figure>
         <figure class=good><strong>&check;</strong><figcaption>Ok</figcaption></figure>
      </section>
      <article>
         <h3>Images</h3>
         <figure>
            <img src=graphics/mock1.jpg alt=neon>
            <img src=subfolder/graphics/mock2.jpg alt=neon>
         </figure>
         <p>Cover 1A</p>
         <p>Cover 1B</p>
         <p>Cover 2A</p>
         <p>Cover 2B</p>
      </article>
   </body>
</html>
